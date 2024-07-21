import { IdlAccounts } from '@coral-xyz/anchor'
import { atom } from 'jotai'
import { QuestBoard } from '../types/quest_board'

export const configAtom = atom<IdlAccounts<QuestBoard>['config'] | null>(null)
