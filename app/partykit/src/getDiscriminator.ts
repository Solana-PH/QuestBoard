import bs58 from 'bs58'
import { stringToSha256 } from './sha256'

export async function getDiscriminator(
  name: string,
  encode?: true
): Promise<string>
export async function getDiscriminator(
  name: string,
  encode?: false
): Promise<Uint8Array>
export async function getDiscriminator(
  name: string,
  encode = true
): Promise<string | Uint8Array> {
  const result = new Uint8Array(
    (await stringToSha256('account:' + name, false)).slice(0, 8)
  )
  return encode ? bs58.encode(result) : result
}
