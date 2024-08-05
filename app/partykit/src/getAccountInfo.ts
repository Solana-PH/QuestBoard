import { createSolanaRpc, devnet, type Address } from '@solana/web3.js'

export async function getAccountInfo(address: string) {
  const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com/'))

  const result = await rpc
    .getAccountInfo(address as Address, { encoding: 'base64' })
    .send()

  return result
}
