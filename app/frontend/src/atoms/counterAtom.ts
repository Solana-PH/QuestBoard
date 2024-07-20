import { Idl, IdlAccounts } from '@coral-xyz/anchor'
import { atom } from 'jotai'
import { QuestBoard } from '../../../../target/types/quest_board'

export const counterAtom = atom<IdlAccounts<QuestBoard>['counter'] | null>(null)
