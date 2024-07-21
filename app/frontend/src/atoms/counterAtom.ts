import { IdlAccounts } from '@coral-xyz/anchor'
import { atom } from 'jotai'
import { QuestBoard } from '../types/quest_board'

export const counterAtom = atom<IdlAccounts<QuestBoard>['counter'] | null>(null)
