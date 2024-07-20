import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

interface QuestDetails {
  id: string
  title: string
  description: string
  reward: string
}

export const questDetailsAtom = atomFamily((id_hash: string) =>
  atom(async (get) => {
    const [id, hash] = id_hash.split('_')

    const response = await fetch(
      `http://192.168.1.32:1999/parties/main/questinfo_${id}?hash=${hash}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const details = await response.json()
    return details as QuestDetails
  })
)
