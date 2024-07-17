import {
  AnchorProvider,
  BN,
  IdlAccounts,
  setProvider,
  workspace,
} from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { QuestBoard } from '../target/types/quest_board'
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token'

import { readFileSync } from 'fs'
import { homedir } from 'os'
import { resolve } from 'path'
import { expect } from 'chai'

function loadKeypair(filePath: string): Keypair {
  const resolvedPath = filePath.startsWith('~')
    ? filePath.replace('~', homedir())
    : filePath
  const absolutePath = resolve(resolvedPath)
  const keypairString = readFileSync(absolutePath, 'utf-8')
  const keypairBuffer = Buffer.from(JSON.parse(keypairString))
  return Keypair.fromSecretKey(keypairBuffer)
}

describe('quest-board', () => {
  // Configure the client to use the local cluster.
  setProvider(AnchorProvider.env())

  const program = workspace.QuestBoard as Program<QuestBoard>
  const authority = loadKeypair('~/.config/solana/id.json')
  const treasuryKeypair = Keypair.generate()
  const offereeKeypair = Keypair.generate()

  let config: IdlAccounts<QuestBoard>['config']
  let counter: IdlAccounts<QuestBoard>['counter']
  let tokenMint: PublicKey
  let ownerAta: PublicKey
  let offereeAta: PublicKey

  const [programDataPda] = PublicKey.findProgramAddressSync(
    [program.programId.toBytes()],
    new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111')
  )

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    program.programId
  )

  const [counterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('counter')],
    program.programId
  )

  const [questPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('quest'), Uint8Array.of(0)],
    program.programId
  )

  before(async () => {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: offereeKeypair.publicKey,
        lamports: 2 * LAMPORTS_PER_SOL,
      })
    )

    await program.provider.sendAndConfirm(transaction)

    tokenMint = await createMint(
      program.provider.connection,
      authority,
      authority.publicKey,
      authority.publicKey,
      9
    )

    ownerAta = (
      await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        authority,
        tokenMint,
        authority.publicKey
      )
    ).address

    offereeAta = (
      await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        authority,
        tokenMint,
        offereeKeypair.publicKey
      )
    ).address

    await Promise.all([
      mintTo(
        program.provider.connection,
        authority,
        tokenMint,
        ownerAta,
        authority,
        1000 * 10 ** 9
      ),
      mintTo(
        program.provider.connection,
        authority,
        tokenMint,
        offereeAta,
        authority,
        1000 * 10 ** 9
      ),
    ])
  })

  it('Is initialized!', async () => {
    config = await program.account.config.fetchNullable(configPda)

    if (!config) {
      await program.methods
        .initialize({
          treasury: treasuryKeypair.publicKey,
          token: tokenMint,
          baseFee: new BN(0.0001 * LAMPORTS_PER_SOL),
          decayFee: new BN(0.0001 * LAMPORTS_PER_SOL),
          decayStart: new BN(0),
          voteThreshold: new BN(0),
          disputeDuration: new BN(0),
          stakedVotePowerStart: new BN(0),
          unstakedVoteUnlockInterval: new BN(0),
        })
        .accounts({
          authority: authority.publicKey,
          // programData: programDataPda,
        })
        .rpc()

      config = await program.account.config.fetch(configPda)
    }

    expect(config.authority.equals(program.provider.publicKey)).to.be.true
  })

  it('Can create a new quest', async () => {
    await program.methods
      .createQuest({
        detailsHash: Array.from(Keypair.generate().publicKey.toBytes()),
        minStakeRequired: new BN(100 * 10 ** 9),
        placementPaid: new BN(0),
        stakeAmount: new BN(100 * 10 ** 9),
      })
      .accounts({
        owner: authority.publicKey,
      })
      .rpc()

    const quest = await program.account.quest.fetch(questPda)
    console.log(quest)
  })

  it('Can update the quest', async () => {})

  it('Can publish the quest', async () => {})

  it('Can unpublish the quest', async () => {})

  it('Can close the quest', async () => {})

  it('Can accept the quest', async () => {})

  it('Can complete the quest', async () => {})
})
