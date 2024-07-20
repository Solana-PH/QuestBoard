import { atom } from 'jotai'
import { counterAtom } from './counterAtom'
import { programAtom } from './programAtom'
import bs58 from 'bs58'

export const questsAtom = atom(async (get) => {
  const program = get(programAtom)
  if (!program) return []

  const counter = get(counterAtom)
  if (!counter) return []

  if (counter.postsOpen === 0) return []

  // fetch all open quests
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
