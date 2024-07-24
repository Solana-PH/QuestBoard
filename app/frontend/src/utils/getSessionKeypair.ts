import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

export const getSessionKeypair = (address: string) => {
  const sessionKeypair = window.localStorage.getItem(
    `session_keypair_${address}`
  )
  if (!sessionKeypair) return null

  return Keypair.fromSecretKey(bs58.decode(sessionKeypair))
}
