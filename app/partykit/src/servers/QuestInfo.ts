import type * as Party from 'partykit/server'
import type { ServerCommon } from './ServerCommon'
import { commonHeaders } from '../commonHeaders'
import { sign } from 'tweetnacl'
import bs58 from 'bs58'
import { stringToSha256 } from '../sha256'

interface QuestDetails {
  id: string
  title: string
  description: string
  reward: string
}

export default class QuestInfo implements ServerCommon {
  name = 'questinfo'
  lastHash: string = ''
  details: Record<string, QuestDetails> = {}

  constructor(readonly room: Party.Room) {}

  async onStart() {
    const items = await this.room.storage.list()
    for (const [key, value] of items) {
      if (key.startsWith('details_')) {
        this.details[key.replace('details_', '')] = value as QuestDetails
      } else if (key.startsWith('lastHash')) {
        this.lastHash = value as string
      }
    }
  }

  async onRequest(req: Party.Request) {
    if (req.method === 'GET') {
      const hash =
        new URL(req.url).searchParams.get('hash') ?? this.lastHash ?? ''
      if (!hash || !this.details[hash]) {
        return new Response('Not found', { status: 404 })
      }

      return new Response(JSON.stringify(this.details[hash]), {
        status: 200,
        headers: commonHeaders,
      })
    } else if (req.method === 'POST') {
      const data: QuestDetails & {
        signature: string
      } = await req.json()
      if (
        !data.id ||
        !data.title ||
        !data.description ||
        !data.reward ||
        !data.signature
      ) {
        return new Response('Missing required fields', { status: 400 })
      }

      const details = [
        data.id,
        data.title.trim(),
        data.description.trim(),
        data.reward.trim(),
      ].join('')

      const message = new TextEncoder().encode(details)
      const signature = bs58.decode(data.signature)
      const pubkey = bs58.decode(data.id)

      if (!sign.detached.verify(message, signature, pubkey)) {
        return new Response('Invalid signature', { status: 400 })
      }

      // get sha256 of the details
      const hash = await stringToSha256(details)
      this.lastHash = hash
      this.details[hash] = {
        id: data.id,
        title: data.title.trim(),
        description: data.description.trim(),
        reward: data.reward.trim(),
      }
      this.room.storage.put(`details_${hash}`, this.details[hash])
      this.room.storage.put('lastHash', hash)

      return new Response(hash, { status: 200, headers: commonHeaders })
    }

    // todo: PATCH method, which will update the details of the quest
    // requires consulting the blockchain and checking the owner of the quest
    // requires signature of the owner as well

    return new Response('Access denied', { status: 403 })
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.close()
  }

  async onMessage(
    message: string | ArrayBufferLike,
    sender: Party.Connection
  ) {}

  static async onBeforeRequest(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    return req
  }
  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    return new Response('Access denied', { status: 403 })
  }
}
