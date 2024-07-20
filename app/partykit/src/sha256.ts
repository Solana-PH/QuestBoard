import bs58 from 'bs58'

export async function stringToSha256(input: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return bs58.encode(new Uint8Array(hashBuffer))
}
