import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { EncryptedMessage, idbAtom } from './idbAtom'
import { userWalletAtom } from './userWalletAtom'
import {
  decryptMessage,
  deriveSharedSecret,
  encryptMessage,
} from '../utils/crypto'
import { Keypair } from '@solana/web3.js'
import { sign } from 'tweetnacl'
import bs58 from 'bs58'

export type Message =
  | {
      questId: string
      type: 'text'
      data: string // encrypted data
      content: string
      senderAddress: string
      timestamp: number
      signature: string
      hash: string // sha256(data (bytes) + key)
      prevHash: string
    }
  | {
      questId: string
      type: 'file'
      data: string // encrypted data
      id: string // file id
      chunkSize: number
      checksum: string
      senderAddress: string
      timestamp: number
      signature: string
      hash: string // sha256(prev hash (bytes) + key)
      prevHash: string
    }

export type MessagePayload =
  | {
      type: 'text'
      content: string
    }
  | { type: 'file'; id: string; chunkSize: number; checksum: string }

export type MessageAction =
  | {
      type: 'add'
      message: EncryptedMessage
    }
  | {
      type: 'set'
      messages: EncryptedMessage[]
    }
  | {
      type: 'encrypt'
      message: MessagePayload
      callback: (clientMessage: { data: string; signature: string }) => void
    }

export const questMessagesBaseAtom = atomFamily((_questId: string) =>
  atom<EncryptedMessage[]>([])
)

export const questMessagesAtom = atomFamily((questId: string) =>
  atom(
    (get) => {
      const encryptedMessages = get(questMessagesBaseAtom(questId))
      if (encryptedMessages.length === 0) return []
      return encryptedMessages.map((m) => m.hash)
    },
    async (get, set, action: MessageAction) => {
      const idb = get(idbAtom)
      if (!idb) return

      switch (action.type) {
        case 'add': {
          await idb.put('messages', action.message)
          set(questMessagesBaseAtom(questId), (prev) => [
            ...prev,
            action.message,
          ])
          break
        }
        case 'set': {
          const tx = idb.transaction('messages', 'readwrite')
          const store = tx.objectStore('messages')
          for (const message of action.messages) {
            await store.put(message)
          }
          await tx.done
          set(questMessagesBaseAtom(questId), action.messages)
          break
        }
        case 'encrypt': {
          const wallet = get(userWalletAtom)
          if (!wallet?.publicKey) return

          const address = wallet.publicKey.toBase58()

          const quest = await idb.get('quest', questId)
          if (!quest) return

          // get the session address used for this quest
          const [me, other] =
            quest.owner.address === address
              ? [quest.owner, quest.taker]
              : [quest.taker, quest.owner]

          const key = await idb.get('session_keys', me.sessionAddress)
          if (!key) return

          const keypair = Keypair.fromSecretKey(key.keypair)
          const secret = await deriveSharedSecret(
            keypair,
            other.encryptionAddress
          )

          const encrypted = await encryptMessage(
            JSON.stringify(action.message),
            secret
          )

          const signature = sign.detached(
            Buffer.from(encrypted),
            keypair.secretKey
          )
          action.callback({
            data: encrypted,
            signature: bs58.encode(signature),
          })

          break
        }
      }
    }
  )
)

export const questMessageAtom = atomFamily((hash: string) =>
  atom<Promise<Message | null>>(async (get) => {
    const idb = get(idbAtom)
    if (!idb) return null

    const wallet = get(userWalletAtom)
    if (!wallet?.publicKey) return null

    const address = wallet.publicKey.toBase58()

    const encryptedMessage = await idb.get('messages', hash)
    if (!encryptedMessage) return null

    const quest = await idb.get('quest', encryptedMessage.questId)
    if (!quest) return null

    const [me, other] =
      quest.owner.address === address
        ? [quest.owner, quest.taker]
        : [quest.taker, quest.owner]

    const key = await idb.get('session_keys', me.sessionAddress)
    if (!key) return null

    const keypair = Keypair.fromSecretKey(key.keypair)
    const secret = await deriveSharedSecret(keypair, other.encryptionAddress)

    const decrypted = JSON.parse(
      await decryptMessage(encryptedMessage.data, secret)
    ) as MessagePayload

    switch (decrypted.type) {
      case 'file': {
        return {
          ...encryptedMessage,
          questId: encryptedMessage.questId,
          type: 'file',
          id: decrypted.id,
          chunkSize: decrypted.chunkSize,
          checksum: decrypted.checksum,
        }
      }
      case 'text':
      default: {
        return {
          ...encryptedMessage,
          questId: encryptedMessage.questId,
          type: 'text',
          content: decrypted.content,
        }
      }
    }
  })
)
