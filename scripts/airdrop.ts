import {
  AnchorProvider,
  Program,
  setProvider,
  workspace,
} from '@coral-xyz/anchor'
import { QuestBoard } from '../target/types/quest_board'
import { loadKeypair, tokenMint } from './utils'
import members from '../app/deidentified_members.json'
import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

const airdrop = async () => {
  setProvider(AnchorProvider.env())

  const program = workspace.QuestBoard as Program<QuestBoard>
  const authority = loadKeypair('~/.config/solana/id.json')

  const startIndex = 0
  let i = startIndex

  for (; i < members.length; i++) {
    try {
      const memberAddress = new PublicKey(members[i].address)

      console.log(`(${i}/${members.length - 1}) ${memberAddress} START`)
      console.log(`Getting member ATA`)
      const memberAta = (
        await getOrCreateAssociatedTokenAccount(
          program.provider.connection,
          authority,
          tokenMint,
          memberAddress
        )
      ).address
      console.log(`Got member ATA: ${memberAta.toBase58()}`)

      console.log(`Checking member balance`)

      const tokenAccountInfo = await getAccount(
        program.provider.connection,
        memberAta
      )

      const balance = Number(tokenAccountInfo.amount) / 10 ** 9
      console.log(`Member balance: ${balance}`)

      if (balance < 400_000) {
        const amount = 400_000 - balance
        console.log(`Airdropping ${amount} tokens to ${memberAddress}`)
        await mintTo(
          program.provider.connection,
          authority,
          tokenMint,
          memberAta,
          authority,
          400_000 * 10 ** 9
        )
        console.log(`Airdrop success`)
      }

      console.log(`(${i}/${members.length - 1}) ${memberAddress} END`)

      await sleep(1000)
      console.log('===================================================')
    } catch (e) {
      console.log(e)
      break
    }
  }

  console.log('Index stopped at:', i)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

airdrop()
