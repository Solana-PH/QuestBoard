import type * as Party from 'partykit/server'
import type { ServerCommon } from './ServerCommon'

export default class Chat implements ServerCommon {
  constructor(readonly room: Party.Room, readonly roleId: string) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.close()
  }

  async onMessage(
    message: string | ArrayBufferLike,
    sender: Party.Connection
  ) {}

  // room:onClose - reset index counter to 0 if there are no people in the room

  static async onBeforeRequest(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    return new Response('Access denied', { status: 403 })
  }

  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    return new Response('Access denied', { status: 403 })
  }
}
