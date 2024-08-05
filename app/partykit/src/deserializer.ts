import bs58 from 'bs58'

export interface Schema {
  name: string
  type: 'u8' | 'u64' | 'pubkey'
  optional?: boolean
}

export const typeSize = {
  u8: 1,
  u64: 8,
  pubkey: 32,
}

export function deserializer(data: Uint8Array, schema: Schema[]) {
  let offset = 0
  const result: Record<string, any> = {}

  for (const { name, type, optional } of schema) {
    if (optional) {
      const flag = data[offset]
      offset += 1
      if (flag === 0) {
        continue
      }
    }

    if (type === 'u8') {
      result[name] = data[offset]
      offset += 1
    } else if (type === 'u64') {
      result[name] = uint8ArrayToBigIntLE(data.slice(offset, offset + 8))
      offset += 8
    } else if (type === 'pubkey') {
      result[name] = bs58.encode(data.slice(offset, offset + 32))
      offset += 32
    } else {
      throw new Error(`Unknown type: ${type}`)
    }
  }

  return result
}

function uint8ArrayToBigIntLE(uint8Array: Uint8Array): BigInt {
  let result = BigInt(0)
  for (let i = uint8Array.length - 1; i >= 0; i--) {
    result = (result << BigInt(8)) + BigInt(uint8Array[i])
  }
  return result
}
