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
  let questPDA: PublicKey
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

  before(async () => {
    const accountInfo = await program.provider.connection.getAccountInfo(
      programDataPda
    )

    if (accountInfo === null) {
      console.log('No account found at the given PDA.')
      return
    }

    // Extract the upgrade_authority_address
    // The program data account layout:
    // Offset 0-4: Account data length
    // Offset 4-36: Slot (u64)
    // Offset 36-68: Program owner (Pubkey)
    // Offset 68-100: Upgrade authority (Pubkey)

    const UPGRADE_AUTHORITY_OFFSET = 68
    const UPGRADE_AUTHORITY_LENGTH = 32

    const upgradeAuthorityBytes = accountInfo.data.slice(
      UPGRADE_AUTHORITY_OFFSET,
      UPGRADE_AUTHORITY_OFFSET + UPGRADE_AUTHORITY_LENGTH
    )
    const upgradeAuthorityAddress = new PublicKey(upgradeAuthorityBytes)

    console.log(
      'Upgrade Authority Address:',
      upgradeAuthorityAddress.toBase58()
    )

    console.log('Payer Address:', program.provider.publicKey.toBase58())

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

  xit('Is initialized!', async () => {
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
          programData: programDataPda,
        })
        .rpc()

      config = await program.account.config.fetch(configPda)
    }

    console.log(config)
  })

  it('Can create a new quest', async () => {})

  it('Can update the quest', async () => {})

  it('Can publish the quest', async () => {})

  it('Can unpublish the quest', async () => {})

  it('Can close the quest', async () => {})

  it('Can accept the quest', async () => {})

  it('Can complete the quest', async () => {})
})
