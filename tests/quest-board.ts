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
  getAccount,
  getAssociatedTokenAddress,
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
  const questId1 = Keypair.generate()
  const questId2 = Keypair.generate()

  let config: IdlAccounts<QuestBoard>['config']
  let counter: IdlAccounts<QuestBoard>['counter']
  let tokenMint: PublicKey
  let ownerAta: PublicKey
  let offereeAta: PublicKey

  // const [programDataPda] = PublicKey.findProgramAddressSync(
  //   [program.programId.toBytes()],
  //   new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111')
  // )

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    program.programId
  )

  const [counterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('counter')],
    program.programId
  )

  const [questPda1] = PublicKey.findProgramAddressSync(
    [Buffer.from('quest'), questId1.publicKey.toBytes()],
    program.programId
  )

  const [questPda2] = PublicKey.findProgramAddressSync(
    [Buffer.from('quest'), questId2.publicKey.toBytes()],
    program.programId
  )

  before(async () => {
    const transaction1 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: offereeKeypair.publicKey,
        lamports: 2 * LAMPORTS_PER_SOL,
      })
    )

    await program.provider.sendAndConfirm(transaction1)

    // IMPORTANT
    // treasury should have a sufficient rent exempt balance else the quest creation will fail
    const transaction2 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: treasuryKeypair.publicKey,
        lamports: 2 * LAMPORTS_PER_SOL,
      })
    )

    await program.provider.sendAndConfirm(transaction2)

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
        })
        .rpc()

      config = await program.account.config.fetch(configPda)
    }

    counter = await program.account.counter.fetchNullable(counterPda)

    expect(config.authority.equals(program.provider.publicKey)).to.be.true
  })

  it('Can create a new quest', async () => {
    const preBalanceInLamports = await program.provider.connection.getBalance(
      authority.publicKey
    )
    console.log('Balance before creation', preBalanceInLamports)

    await program.methods
      .createQuest({
        detailsHash: Array.from(Keypair.generate().publicKey.toBytes()),
        minStakeRequired: new BN(100 * 10 ** 9),
        placementPaid: new BN(0), //new BN(0.1 * LAMPORTS_PER_SOL),
        stakeAmount: new BN(100 * 10 ** 9),
      })
      .accounts({
        owner: authority.publicKey,
        id: questId1.publicKey,
      })
      .signers([questId1])
      .rpc()

    const quest = await program.account.quest.fetch(questPda1)
    expect(quest.owner.equals(authority.publicKey)).to.be.true

    const associatedTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      authority.publicKey
    )

    const tokenAccountInfo = await getAccount(
      program.provider.connection,
      associatedTokenAccount
    )

    const balance = tokenAccountInfo.amount
    expect(Number(balance) / 10 ** 9).to.be.equal(900)

    const postBalanceInLamports = await program.provider.connection.getBalance(
      authority.publicKey
    )
    console.log('Balance after creation', postBalanceInLamports)

    console.log(
      'Balance diff',
      (postBalanceInLamports - preBalanceInLamports) / LAMPORTS_PER_SOL
    )
  })

  it('Can update the quest', async () => {
    const randomBytes = Array.from(Keypair.generate().publicKey.toBytes())

    await program.methods
      .updateQuest({
        detailsHash: randomBytes,
        minStakeRequired: new BN(50 * 10 ** 9),
      })
      .accounts({
        owner: authority.publicKey,
      })
      .accountsPartial({
        quest: questPda1,
      })
      .rpc()

    const quest = await program.account.quest.fetch(questPda1)
    expect(quest.detailsHash).to.be.deep.equal(randomBytes)
    expect(quest.minStakeRequired.toNumber()).to.be.equal(50 * 10 ** 9)
  })

  it('Can publish the quest', async () => {
    await program.methods
      .publishQuest()
      .accounts({
        owner: authority.publicKey,
      })
      .accountsPartial({
        quest: questPda1,
      })
      .rpc()

    const quest = await program.account.quest.fetch(questPda1)
    expect(quest.status).to.be.equal(1)
  })

  it('Can unpublish the quest', async () => {
    await program.methods
      .unpublishQuest()
      .accounts({
        owner: authority.publicKey,
      })
      .accountsPartial({
        quest: questPda1,
      })
      .rpc()

    const quest = await program.account.quest.fetch(questPda1)
    expect(quest.status).to.be.equal(0)
  })

  it('Can close the quest', async () => {
    const preBalanceInLamports = await program.provider.connection.getBalance(
      authority.publicKey
    )
    console.log('Balance before closing', preBalanceInLamports)

    await program.methods
      .closeQuest()
      .accounts({
        owner: authority.publicKey,
      })
      .accountsPartial({
        quest: questPda1,
      })
      .rpc()

    const quest = await program.account.quest.fetchNullable(questPda1)
    expect(quest).to.be.equal(null)

    const associatedTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      authority.publicKey
    )

    const tokenAccountInfo = await getAccount(
      program.provider.connection,
      associatedTokenAccount
    )

    const balance = tokenAccountInfo.amount
    expect(Number(balance) / 10 ** 9).to.be.equal(1000) // should be able to retrieve back the DAO tokens

    const postBalanceInLamports = await program.provider.connection.getBalance(
      authority.publicKey
    )
    console.log('Balance after closing', postBalanceInLamports)

    console.log(
      'Balance diff',
      (postBalanceInLamports - preBalanceInLamports) / LAMPORTS_PER_SOL
    )
  })

  it('Can accept the quest', async () => {})

  it('Can complete the quest', async () => {})
})
