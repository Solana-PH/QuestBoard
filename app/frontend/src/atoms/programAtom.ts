import { atom } from 'jotai'
import { Program } from '@coral-xyz/anchor'
import { anchorProviderAtom } from './anchorProviderAtom'
import { QuestBoard } from '../types/quest_board'
import QuestBoardIdl from '../idl/quest_board.json'
import { PublicKey } from '@solana/web3.js'

const questBoard = QuestBoardIdl as QuestBoard
export const PROGRAM_ID = new PublicKey(questBoard.address)

export const programAtom = atom((get) => {
  const provider = get(anchorProviderAtom)

  if (!provider) return null

  return new Program<QuestBoard>(questBoard, provider)
})
