import type * as Party from 'partykit/server'
import type { ServerCommon } from './ServerCommon'
import { commonHeaders } from '../commonHeaders'

import bs58 from 'bs58'
import { sign } from 'tweetnacl'
import { decodeQuestData, type QuestData } from '../decodeQuestData'
import { getAccountData } from '../getAccountData'
import { getUserDetails } from '../getUserDetails'

export default class Quest implements ServerCommon {
  name = 'quest'
  authorizedAddresses = new Set<string>()
  quest: QuestData | null = null

  // todo:
  // implement file system

  constructor(readonly room: Party.Room) {}

  async onStart() {
    this.authorizedAddresses =
      (await this.room.storage.get('authorizedAddresses')) ?? new Set<string>()
    this.quest = (await this.room.storage.get('quest')) || null
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.close()
  }

  async onMessage(
    message: string | ArrayBufferLike,
    sender: Party.Connection
  ) {}

  async onRequest(req: Party.Request) {
    const [, address] = this.room.id.split('_')
    const accountData = await getAccountData(address)

    if (accountData === null) throw new Error('Account not found')

    const quest = this.quest ?? decodeQuestData(accountData)

    if (req.method === 'GET') {
      ;(BigInt.prototype as any).toJSON = function () {
        return this.toString()
      }

      return new Response(JSON.stringify(quest), {
        status: 200,
        headers: commonHeaders,
      })
    } else if (req.method === 'POST') {
      // POST request from any of the participants to check on-chain account
      // flag user as joined, allow access to socket channel
      const userAddress = req.headers.get('X-User-Address') ?? ''

      if (userAddress === quest.offeree || userAddress === quest.owner) {
        this.authorizedAddresses.add(userAddress)
        await this.room.storage.put(
          'authorizedAddresses',
          this.authorizedAddresses
        )
      }

      if (!this.quest) {
        this.quest = quest
        await this.room.storage.put('quest', quest)
      }

      // store signal pre-keys
    }

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

    if (req.method === 'POST') {
      try {
        const token = req.headers.get('Authorization') ?? ''

        if (!token) {
          throw new Error('Token not provided')
        }

        const [address, message, signature] = token.split('.')
        const main = lobby.parties.main
        const userInfo = main.get(`userinfo_${address}`)
        const userDetails = await getUserDetails(userInfo)
        const sessionAddress = bs58.decode(userDetails.sessionAddress)

        if (
          !sign.detached.verify(
            new TextEncoder().encode(message),
            bs58.decode(signature),
            sessionAddress
          )
        ) {
          throw new Error('Invalid signature')
        }

        req.headers.set('X-User-Address', address)

        return req
      } catch (e) {
        console.error(e)
        return new Response('Unauthorized', { status: 401 })
      }
    }

    return req
  }

  static async onBeforeConnect(
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

    return new Response('Access denied', {
      status: 403,
      headers: commonHeaders,
    })
  }
}
