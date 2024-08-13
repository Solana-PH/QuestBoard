import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { idbAtom, Message } from './idbAtom'
import { userWalletAtom } from './userWalletAtom'
import {
  decryptMessage,
  deriveSharedSecret,
  encryptMessage,
} from '../utils/crypto'
import { Keypair } from '@solana/web3.js'
import { sign } from 'tweetnacl'
import bs58 from 'bs58'

export interface ChatMessage {
  data: string // base 58 encoded, encrypted
  hash: string // sha256(previous message hash + data, encrypted), backend generated
  timestamp: number // backend generated
  senderAddress: string // backend generated
  signature: string // signature of the data (encrypted), using session address
}

export type MessagePayload =
  | {
      type: 'text'
      message: string
    }
  | { type: 'file'; id: string; chunkSize: number; checksum: string }

export type MessageAction =
  | {
      type: 'add'
      message: ChatMessage
    }
  | {
      type: 'set'
      messages: ChatMessage[]
    }
  | {
      type: 'encrypt'
      message: MessagePayload
      callback: (clientMessage: { data: string; signature: string }) => void
    }

export const questMessagesBaseAtom = atomFamily((_questId: string) =>
  atom<Message[]>([])
)

export const questMessagesAtom = atomFamily((questId: string) =>
  atom(
    (get) => {
      return get(questMessagesBaseAtom(questId))
    },
    async (get, set, action: MessageAction) => {
      const wallet = get(userWalletAtom)
      if (!wallet?.publicKey) return

      const address = wallet.publicKey.toBase58()

      const idb = get(idbAtom)
      if (!idb) return

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
      const secret = await deriveSharedSecret(keypair, other.encryptionAddress)

      const parseMessage = async (message: ChatMessage): Promise<Message> => {
        const data = JSON.parse(
          await decryptMessage(message.data, secret)
        ) as MessagePayload

        switch (data.type) {
          case 'file': {
            return {
              type: 'file',
              id: data.id,
              chunkSize: data.chunkSize,
              checksum: data.checksum,
              senderAddress: message.senderAddress,
              timestamp: message.timestamp,
              signature: message.signature,
              hash: message.hash,
            }
          }
          case 'text':
          default: {
            return {
              type: 'text',
              data: data.message,
              senderAddress: message.senderAddress,
              timestamp: message.timestamp,
              signature: message.signature,
              hash: message.hash,
            }
          }
        }
      }

      switch (action.type) {
        case 'add': {
          const message = await parseMessage(action.message)
          set(questMessagesBaseAtom(questId), (prev) => [...prev, message])
          break
        }
        case 'set': {
          const messages = await Promise.all(action.messages.map(parseMessage))
          // idb.put('messages', messages)
          set(questMessagesBaseAtom(questId), messages)
          break
        }
        case 'encrypt': {
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
