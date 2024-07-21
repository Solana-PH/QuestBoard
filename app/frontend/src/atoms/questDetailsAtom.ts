import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { partykitAddress } from '../constants/partykitAddress'

export interface QuestDetails {
  id: string
  title: string
  description: string
  reward: string
}

export const questDetailsAtom = atomFamily((id_hash: string) =>
  atom(async (get) => {
    if (id_hash === '') return null
    const [id, hash] = id_hash.split('_')

    const response = await fetch(
      `${partykitAddress}/parties/main/questinfo_${id}?hash=${hash}`,
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
