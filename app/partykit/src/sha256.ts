import bs58 from 'bs58'

export async function stringToSha256(
  input: string,
  encode?: true
): Promise<string>
export async function stringToSha256(
  input: string,
  encode?: false
): Promise<ArrayBuffer>
export async function stringToSha256(
  input: string,
  encode?: boolean
): Promise<string | ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return encode ? bs58.encode(new Uint8Array(hashBuffer)) : hashBuffer
}
