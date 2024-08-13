import { Keypair } from '@solana/web3.js'
import { partykitAddress } from '../constants/partykitAddress'
import { getAccessToken } from './getAccessToken'
import { getSessionKeypair } from './getSessionKeypair'
import { convertEd25519ToCurve25519 } from './crypto'
import bs58 from 'bs58'
import { sign } from 'tweetnacl'

export const joinQuestRoom = async (address: string, questId: string) => {
  const keypair = getSessionKeypair(address)
  if (!keypair) throw Error('No session keypair found')

  const sessionKeypair = Keypair.generate()
  const curveKeypair = await convertEd25519ToCurve25519(
    sessionKeypair.secretKey
  )
  const encryptionAddress = bs58.encode(curveKeypair.publicKey)

  const message = `${sessionKeypair.publicKey.toBase58()}_${encryptionAddress}`
  const signature = bs58.encode(
    sign.detached(Buffer.from(message), sessionKeypair.secretKey)
  )

  const token = [
    address,
    getAccessToken(keypair, `${message}_${signature}`),
  ].join('.')

  const response = await fetch(
    `${partykitAddress}/parties/main/quest_${questId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    }
  )

  const registeredUser = await response.json()

  if (registeredUser.encryptionAddress === encryptionAddress) {
    return sessionKeypair
  }
  return null
}
