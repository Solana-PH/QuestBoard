import { DBSchema, IDBPDatabase } from 'idb'
import { atom } from 'jotai'

// all data stored in IDB is already unencrypted

export interface QuestMember {
  address: string
  sessionAddress: string // solana pubkey used to auth
  encryptionAddress: string // solana pubkey used to encrypt messages

  // todo: Signal Protocol
}

// genesis Message hash should be the proposal_hash
export type Message =
  | {
      type: 'text'
      data: string
      senderAddress: string
      timestamp: number
      signature: string
      hash: string // sha256(data (bytes) + key)
    }
  | {
      type: 'file'
      id: string
      chunkSize: number
      checksum: string
      senderAddress: string
      timestamp: number
      signature: string
      hash: string // sha256(prev hash (bytes) + key)
    }

export interface QuestBoardIDBSchema extends DBSchema {
  session_keys: {
    key: string
    value: {
      id: string
      keypair: Uint8Array
      downloaded: boolean
      active: boolean
    }
  }
  proposal_hash: {
    key: string
    value: string
  }
  // file processing:
  // 1. user uploads the file
  // 2. browser processes the file into chunks
  // 3. store these chunks in the IDB
  // 4. user send "File" message with the key of the file
  // 5. other party requests the file chunks from the sender
  // 6. sender streams the chunks to the receiver
  // 7. receiver processes the chunks into a file
  // 8. receiver stores the file in the IDB
  // 9. receiver checks the checksum of the file
  files: {
    key: string
    value: {
      id: string // same as key
      data: ArrayBuffer
      type: string
      questId: string
      owner: string
      chunkSize: number
      chunks: {
        index: number
        data: ArrayBuffer
      }[]
      checksum: string
    }
  }
  quest: {
    key: string
    value: {
      id: string // quest id (base58)
      proposal: string // JSON of the proposal details and staked amount
      owner: QuestMember
      taker: QuestMember
      messages: Message[]
    }
  }
}

export const idbAtom = atom<IDBPDatabase<QuestBoardIDBSchema> | null>(null)
