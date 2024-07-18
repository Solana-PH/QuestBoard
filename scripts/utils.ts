import { readFileSync } from 'fs'
import { homedir } from 'os'
import { resolve } from 'path'
import { BN } from 'bn.js'
import { Keypair, PublicKey } from '@solana/web3.js'

export const tokenMint = new PublicKey(
  'iJ5yihahjESi2Tg51YHMb7uXkJF4ELx72bVHXJgBkzZ'
)

export function loadKeypair(filePath: string): Keypair {
  const resolvedPath = filePath.startsWith('~')
    ? filePath.replace('~', homedir())
    : filePath
  const absolutePath = resolve(resolvedPath)
  const keypairString = readFileSync(absolutePath, 'utf-8')
  const keypairBuffer = Buffer.from(JSON.parse(keypairString))
  return Keypair.fromSecretKey(keypairBuffer)
}
