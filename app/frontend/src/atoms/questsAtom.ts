import { atom } from 'jotai'
import { counterAtom } from './counterAtom'
import { programAtom } from './programAtom'
import bs58 from 'bs58'
import { atomFamily } from 'jotai/utils'
import { PublicKey } from '@solana/web3.js'
import { questDetailsAtom } from './questDetailsAtom'
import { presenceRawAtom } from './presenceAtom'
import { IdlAccounts, ProgramAccount } from '@coral-xyz/anchor'
import { QuestBoard } from '../types/quest_board'

export const questsAtom = atom(async (get) => {
  const program = get(programAtom)
  if (!program) return []

  const counter = get(counterAtom)
  if (!counter) return []

  if (counter.postsOpen.toNumber() === 0) return []

  // fetch all open Quests
  const result = await program.account.quest.all([
    {
      memcmp: {
        offset: 9, // discriminator (8) + bump (1)
        bytes: bs58.encode(Uint8Array.of(1)), // 1: open flag
      },
    },
  ])

  return result ?? []
})

export const sortedQuestsAtom = atom(async (get) => {
  const presence = get(presenceRawAtom)
  const result = await get(questsAtom)
  result.sort(sortFn(presence))

  return result ?? []
})

export const myOngoingQuestsAtom = atom(async (get) => {
  const program = get(programAtom)
  if (!program?.provider.publicKey) return []

  const counter = get(counterAtom)
  if (!counter) return []

  if (counter.postsTaken.toNumber() === 0) return []

  const myAddress = program.provider.publicKey.toBase58()

  const [myTakenQuests, myAcceptedQuests] = await Promise.all([
    // fetch all my taken Quests
    program.account.quest.all([
      {
        memcmp: {
          offset: 9, // discriminator (8) + bump (1)
          bytes: bs58.encode(Uint8Array.of(3)), // 3: taken flag
        },
      },
      {
        memcmp: {
          offset: 10, // discriminator (8) + bump (1) + status (1)
          bytes: myAddress,
        },
      },
    ]),
    // fetch all my accepted Quests
    program.account.quest.all([
      {
        memcmp: {
          offset: 9, // discriminator (8) + bump (1)
          bytes: bs58.encode(Uint8Array.of(3)), // 3: taken flag
        },
      },
      {
        memcmp: {
          offset: 148, // 8 + 1 + 1 + 32 + 8 + 8 + 8 + 8 + 32 + 32 + (1 + 8) + (1 + _)
          bytes: myAddress,
        },
      },
    ]),
  ])
  const result = [...myTakenQuests, ...myAcceptedQuests]

  return result ?? []
})

export const mySortedOnGoingQuestsAtom = atom(async (get) => {
  const presence = get(presenceRawAtom)
  const result = await get(myOngoingQuestsAtom)
  result.sort(sortFn(presence))

  return result ?? []
})

export const questAtom = atomFamily((questPda: string) =>
  atom(async (get) => {
    if (questPda === '') return null

    const program = get(programAtom)
    if (!program) return null

    const result = await program.account.quest.fetch(new PublicKey(questPda))
    if (!result) return null

    const details = await get(
      questDetailsAtom(
        result.id.toBase58() + '_' + bs58.encode(result.detailsHash)
      )
    )

    return {
      account: result,
      details,
    }
  })
)

type QuestAccount = ProgramAccount<IdlAccounts<QuestBoard>['quest']>

function sortFn(presence: string) {
  return (a: QuestAccount, b: QuestAccount) => {
    // check presence
    const aOwnerPresent = presence.includes(a.account.owner.toBase58())
    const bOwnerPresent = presence.includes(b.account.owner.toBase58())

    if (aOwnerPresent !== bOwnerPresent) {
      return aOwnerPresent ? -1 : 1
    }

    // check amount paid
    // sort the result based on the number of placement boosts
    const aBoost = a.account.placementPaid.toNumber()
    const bBoost = b.account.placementPaid.toNumber()

    if (aBoost !== bBoost) {
      return bBoost - aBoost
    }

    // check amount staked
    const aStake = a.account.staked.toNumber()
    const bStake = b.account.staked.toNumber()

    if (aStake !== bStake) {
      return bStake - aStake
    }

    // check min required stake
    const aMinStake = a.account.minStakeRequired.toNumber()
    const bMinStake = b.account.minStakeRequired.toNumber()

    if (aMinStake !== bMinStake) {
      return aMinStake - bMinStake // should be opposite
    }

    // sort by block height, older ones on top
    const aTimeStamp = a.account.timestamp.toNumber()
    const bTimeStamp = b.account.timestamp.toNumber()

    if (aTimeStamp !== bTimeStamp) {
      return aTimeStamp - bTimeStamp
    }

    // rest, just sort by id
    const aPubkey = a.publicKey.toBase58()
    const bPubkey = b.publicKey.toBase58()

    return aPubkey.localeCompare(bPubkey)
  }
}
