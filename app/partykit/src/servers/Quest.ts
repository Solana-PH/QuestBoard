import type * as Party from 'partykit/server'
import type { ServerCommon } from './ServerCommon'
import { commonHeaders } from '../commonHeaders'

import { getDiscriminator } from '../getDiscriminator'
import bs58 from 'bs58'
import { decodeQuestData } from '../decodeQuestData'
import { getAccountData } from '../getAccountData'

export default class Quest implements ServerCommon {
  name = 'quest'

  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.close()
  }

  async onMessage(
    message: string | ArrayBufferLike,
    sender: Party.Connection
  ) {}

  async onRequest(req: Party.Request) {
    if (req.method === 'GET') {
      const [, address] = this.room.id.split('_')
      const accountData = await getAccountData(address)

      if (accountData === null) throw new Error('Account not found')

      const quest = decodeQuestData(accountData)

      ;(BigInt.prototype as any).toJSON = function () {
        return this.toString()
      }

      return new Response(JSON.stringify(quest), {
        status: 200,
        headers: commonHeaders,
      })
    }

    // POST request from any of the participants to check on-chain account
    // use offset memcmp match

    return new Response('Access denied', {
      status: 403,
      headers: commonHeaders,
    })
  }

  static async onBeforeRequest(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: commonHeaders,
      })
    }
    return req

    // return new Response('Access denied', {
    //   status: 403,
    //   headers: commonHeaders,
    // })
  }
  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    return new Response('Access denied', {
      status: 403,
      headers: commonHeaders,
    })
  }
}

// const result = rpc.getProgramAccounts(programAddress as Address, {
//   commitment: 'confirmed',
//   encoding: 'base64',
//   filters: [
//     {
//       memcmp: {
//         offset: 0n,
//         bytes: await getDiscriminator('Quest'),
//         encoding: 'base58',
//       },
//     },
//     {
//       memcmp: {
//         offset: 9n,
//         bytes: bs58.encode(Uint8Array.of(3)),
//         encoding: 'base58',
//       },
//     },
//   ],
// })

// const response = await result.send()

// ;(BigInt.prototype as any).toJSON = function () {
//   return this.toString()
// }

// return new Response(JSON.stringify(response), {
//   status: 200,
//   headers: commonHeaders,
// })
