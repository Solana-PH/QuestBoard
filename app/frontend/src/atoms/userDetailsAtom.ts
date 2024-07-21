import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

interface UserDetails {
  sessionAddress: string
  availableStart: number
  availableEnd: number
}

const refresherAtom = atom(Date.now())

export const userDetailsAtom = atomFamily((address: string) =>
  atom(
    async (get) => {
      if (!address) return null
      get(refresherAtom)
      try {
        const response = await fetch(
          `http://192.168.1.32:1999/parties/main/userinfo_${address}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.status === 404) {
          return 'unregistered'
        }

        const details = await response.json()
        return details as UserDetails
      } catch (e) {
        console.error('User Details Error:', e)
      }
      return null
    },
    (_, set) => {
      set(refresherAtom, Date.now())
    }
  )
)
