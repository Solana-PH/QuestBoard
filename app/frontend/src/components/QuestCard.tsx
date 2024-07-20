import { IdlAccounts, ProgramAccount } from '@coral-xyz/anchor'
import { FC } from 'react'
import { QuestBoard } from '../../../../target/types/quest_board'

export const QuestCard: FC<
  ProgramAccount<IdlAccounts<QuestBoard>['quest']>
> = ({ account, publicKey }) => {
  return <>{publicKey.toBase58()}</>
}
