import { scalarMult } from 'tweetnacl'
import bs58 from 'bs58'
import { Keypair } from '@solana/web3.js'

export const convertEd25519ToCurve25519 = async (ed25519Key: Uint8Array) => {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-512',
    ed25519Key.slice(0, 32)
  )
  const h = new Uint8Array(hashBuffer)

  h[0] &= 248
  h[31] &= 127
  h[31] |= 64

  const secretKey = h.slice(0, 32)

  return {
    secretKey,
    publicKey: scalarMult.base(secretKey),
  }
}

export async function deriveSharedSecret(
  sessionKeypair: Keypair,
  toAddress: string
) {
  const to = bs58.decode(toAddress)
  const curve = await convertEd25519ToCurve25519(sessionKeypair.secretKey)

  return scalarMult(curve.secretKey.subarray(0, 32), to.subarray(0, 32))
}

export async function encryptMessage(
  message: string,
  sharedSecret: Uint8Array
) {
  const iv = crypto.getRandomValues(new Uint8Array(12)) // Initialization vector
  const encodedMessage = new TextEncoder().encode(message)

  const aesKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    encodedMessage
  )

  return `${bs58.encode(iv)}.${bs58.encode(new Uint8Array(encrypted))}`
}

export async function decryptMessage(
  encryptedMessage: string,
  sharedSecret: Uint8Array
) {
  const [iv, ciphertext] = encryptedMessage.split('.')
  const ivArray = new Uint8Array(bs58.decode(iv))
  const ciphertextArray = new Uint8Array(bs58.decode(ciphertext))

  const aesKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivArray,
    },
    aesKey,
    ciphertextArray
  )

  return new TextDecoder().decode(decrypted)
}
