import { readFileSync } from 'fs'
import { homedir } from 'os'
import { resolve } from 'path'
import { BN } from 'bn.js'
import { Keypair } from '@solana/web3.js'

export function loadKeypair(filePath: string): Keypair {
  const resolvedPath = filePath.startsWith('~')
    ? filePath.replace('~', homedir())
    : filePath
  const absolutePath = resolve(resolvedPath)
  const keypairString = readFileSync(absolutePath, 'utf-8')
  const keypairBuffer = Buffer.from(JSON.parse(keypairString))
  return Keypair.fromSecretKey(keypairBuffer)
}
