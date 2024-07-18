import {
  AnchorProvider,
  Program,
  setProvider,
  workspace,
} from '@coral-xyz/anchor'
import { QuestBoard } from '../target/types/quest_board'
import { loadKeypair } from './utils'
import { createMint } from '@solana/spl-token'

const mintToken = async () => {
  setProvider(AnchorProvider.env())

  const program = workspace.QuestBoard as Program<QuestBoard>
  const authority = loadKeypair('~/.config/solana/id.json')

  const tokenMint = await createMint(
    program.provider.connection,
    authority,
    authority.publicKey,
    authority.publicKey,
    9
  )

  console.log('Token mint:', tokenMint.toBase58()) // iJ5yihahjESi2Tg51YHMb7uXkJF4ELx72bVHXJgBkzZ
}

mintToken()
