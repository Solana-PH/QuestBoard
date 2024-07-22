import type * as Party from 'partykit/server'
import type { ServerCommon } from './ServerCommon'
import { commonHeaders } from '../commonHeaders'

export default class Presence implements ServerCommon {
  name = 'presence'
  connections: Set<string> = new Set()

  constructor(readonly room: Party.Room) {}

  async onStart() {
    const keys = [...(await this.room.storage.list()).keys()].map((k) =>
      k.replace('user_', '')
    )
    this.connections = new Set(keys)
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.send(JSON.stringify(Array.from(this.connections)))
  }

  async onMessage(
    message: string | ArrayBufferLike,
    sender: Party.Connection
  ) {}

  async onRequest(req: Party.Request) {
    if (req.method === 'GET') {
      return new Response(JSON.stringify(Array.from(this.connections)), {
        status: 200,
        headers: commonHeaders,
      })
    } else if (req.method === 'POST') {
      const updates = (await req.json()) as {
        type: 'connect' | 'disconnect'
        address: string
      }[]

      updates.forEach((update) => {
        if (update.type === 'connect') {
          this.connections.add(update.address)
          this.room.storage.put(`user_${update.address}`, '')
        } else {
          this.connections.delete(update.address)
          this.room.storage.delete(`user_${update.address}`)
        }
      })

      this.room.broadcast(JSON.stringify(Array.from(this.connections)))

      return new Response('OK', {
        status: 200,
        headers: commonHeaders,
      })
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
    return req
  }

  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    return req
  }
}
