import { atom } from 'jotai'
import { counterAtom } from './counterAtom'
import { programAtom } from './programAtom'
import bs58 from 'bs58'
import { atomFamily } from 'jotai/utils'
import { PublicKey } from '@solana/web3.js'
import { questDetailsAtom } from './questDetailsAtom'
import { presenceRawAtom } from './presenceAtom'

export const questsAtom = atom(async (get) => {
  const program = get(programAtom)
  if (!program) return []

  const counter = get(counterAtom)
  if (!counter) return []

  if (counter.postsOpen.toNumber() === 0) return []

  const presence = get(presenceRawAtom)

  // fetch all open quests
  const result = await program.account.quest.all([
    {
      memcmp: {
        offset: 9, // discriminator (8) + bump (1)
        bytes: bs58.encode(Uint8Array.of(1)), // 1: open flag
      },
    },
  ])

  // sort the result based on the number of placement boosts
  // descending
  result.sort((a, b) => {
    // check presence
    const aOwnerPresent = presence.includes(a.account.owner.toBase58())
    const bOwnerPresent = presence.includes(b.account.owner.toBase58())

    if (aOwnerPresent !== bOwnerPresent) {
      return aOwnerPresent ? -1 : 1
    }

    // check amount paid
    const aBoost = a.account.placementPaid.toNumber()
    const bBoost = b.account.placementPaid.toNumber()

    return bBoost - aBoost
  })

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
