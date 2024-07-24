import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import bs58 from 'bs58'
import { Keypair } from '@solana/web3.js'
import { userWalletAtom } from './userWalletAtom'
import { partykitAddress } from '../constants/partykitAddress'

export interface UserDetails {
  sessionAddress: string
  availableStart: number
  availableEnd: number
}

const refresherAtom = atomFamily((_: string) => atom(Date.now()))

export const userDetailsAtom = atomFamily((address: string) =>
  atom(
    async (get) => {
      if (!address) return null
      get(refresherAtom(address))
      try {
        const response = await fetch(
          `${partykitAddress}/parties/main/userinfo_${address}`,
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

        const details = (await response.json()) as UserDetails

        return details
      } catch (e) {
        console.error('User Details Error:', e)
      }
      return null
    },
    (_, set) => {
      set(refresherAtom(address), Date.now())
    }
  )
)

export const myDetailsAtom = atom(
  async (get) => {
    const wallet = get(userWalletAtom)
    if (!wallet?.publicKey) return null

    const walletAddress = wallet.publicKey.toBase58()

    const details = await get(userDetailsAtom(walletAddress))
    if (details === 'unregistered') return details

    // check if the user has the same session address
    // from the stored session keypair

    const sessionKey = window.localStorage.getItem(
      `session_keypair_${walletAddress}`
    )
    if (!sessionKey) return 'missing'

    const sessionKeypair = Keypair.fromSecretKey(bs58.decode(sessionKey))
    if (sessionKeypair.publicKey.toBase58() !== details?.sessionAddress) {
      return `different_${details?.sessionAddress ?? ''}`
    }

    return details
  },
  (get, set) => {
    const wallet = get(userWalletAtom)
    if (!wallet?.publicKey) return null
    set(refresherAtom(wallet.publicKey.toBase58()), Date.now())
  }
)
