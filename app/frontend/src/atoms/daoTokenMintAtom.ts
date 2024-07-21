import { PublicKey } from '@solana/web3.js'
import { configAtom } from './configAtom'
import { userWalletAtom } from './userWalletAtom'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { atom } from 'jotai'

export const daoTokenMintAtom = atom<string | null>((get) => {
  const config = get(configAtom)

  if (!config) return null

  return config.tokenMint.toBase58()
})

export const userDaoAtaAtom = atom<string | null>((get) => {
  const wallet = get(userWalletAtom)

  if (!wallet?.publicKey) return null

  const tokenMint = get(daoTokenMintAtom)

  if (!tokenMint) return null

  const associatedTokenAccount = getAssociatedTokenAddressSync(
    new PublicKey(tokenMint),
    new PublicKey(wallet.publicKey)
  )

  return associatedTokenAccount.toBase58()
})
