import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import { presenceRawAtom } from './presenceAtom'

const refresherAtom = atomFamily((_: string) => atom(Date.now()))

export const userConnectionStatusAtom = atomFamily((address: string) =>
  atom(
    async (get) => {
      if (address === '') return null
      if (typeof address !== 'string') return null

      return get(presenceRawAtom).includes(address)

      // get(refresherAtom(address))
      // const response = await fetch(
      //   `${partykitAddress}/parties/main/user_${address}`,
      //   {
      //     method: 'GET',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // )

      // if (!response.ok) {
      //   return null
      // }

      // const status = await response.json()
      // return status.online
    },
    (_, set) => {
      set(refresherAtom(address), Date.now())
    }
  )
)
