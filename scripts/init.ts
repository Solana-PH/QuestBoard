import {
  AnchorProvider,
  Program,
  setProvider,
  workspace,
} from '@coral-xyz/anchor'
import { QuestBoard } from '../target/types/quest_board'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { BN } from 'bn.js'
import { loadKeypair } from './utils'

const init = async () => {
  setProvider(AnchorProvider.env())

  const program = workspace.QuestBoard as Program<QuestBoard>
  const authority = loadKeypair('~/.config/solana/id.json')
  const tokenMint = new PublicKey('iJ5yihahjESi2Tg51YHMb7uXkJF4ELx72bVHXJgBkzZ')
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    program.programId
  )
  const [counterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('counter')],
    program.programId
  )

  let config = await program.account.config.fetchNullable(configPda)

  // block time in solana is around 400ms
  // so for 1 second, we need to wait for 2.5 blocks
  // so for 1 minute, we need to wait for 150 blocks
  // so for 1 hour, we need to wait for 9000 blocks
  // so for 1 day, we need to wait for 216000 blocks
  // so for 1 week, we need to wait for 1512000 blocks
  // so for 1 month, we need to wait for 6480000 blocks

  if (!config) {
    await program.methods
      .initialize({
        treasury: authority.publicKey,
        token: tokenMint,
        baseFee: new BN(0.0001 * LAMPORTS_PER_SOL),
        decayFee: new BN(0.0001 * LAMPORTS_PER_SOL),
        decayStart: new BN(1512000), // 1 week
        voteThreshold: new BN(1_000_000 * 10 ** 9), // we need to have 1m votes to reach concensus
        disputeDuration: new BN(6480000), // 1 month
        stakedVotePowerStart: new BN(0), // immediate
        unstakedVoteUnlockInterval: new BN(216000), // daily
      })
      .accounts({
        authority: authority.publicKey,
      })
      .rpc()

    config = await program.account.config.fetch(configPda)
  }

  console.log('Config account:', configPda.toBase58())
}

init()
