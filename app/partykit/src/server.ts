import type * as Party from 'partykit/server'
import Chat from './servers/Chat'
import Core from './servers/Core'
import Default from './servers/Default'
import type { ServerCommon } from './servers/ServerCommon'

export default class Server implements Party.Server {
  readonly server: ServerCommon

  constructor(readonly room: Party.Room) {
    const [role, id] = room.id.toLowerCase().trim().split('/')
    switch (role) {
      case 'core':
        this.server = new Core(room)
        break
      case 'chat':
        this.server = new Chat(room, id)
        break
      default:
        this.server = new Default(room)
        break
    }
  }

  async onStart() {
    return this.server.onStart?.()
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    return this.server.onConnect?.(conn, ctx)
  }

  async onMessage(message: string | ArrayBufferLike, sender: Party.Connection) {
    return this.server.onMessage?.(message, sender)
    // todo:
    // https://github.com/nameskyteam/borsher
    // introduce a discriminator
  }

  async onClose(connection: Party.Connection) {
    return this.server.onClose?.(connection)
  }

  async onError(connection: Party.Connection, error: Error) {
    return this.server.onError?.(connection, error)
  }

  async onRequest(req: Party.Request) {
    return (
      this.server.onRequest?.(req) ??
      new Response('Access denied', { status: 403 })
    )
  }

  async onAlarm() {
    return this.server.onAlarm?.()
  }

  static async onBeforeRequest(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    const [role] = lobby.id.toLowerCase().trim().split('/')
    switch (role) {
      case 'core':
        return Core.onBeforeRequest(req, lobby, ctx)
      case 'chat':
        return Chat.onBeforeRequest(req, lobby, ctx)
      default:
        return Default.onBeforeRequest(req, lobby, ctx)
    }
  }

  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    const [role] = lobby.id.toLowerCase().trim().split('/')
    switch (role) {
      case 'core':
        return Core.onBeforeConnect(req, lobby, ctx)
      case 'chat':
        return Chat.onBeforeConnect(req, lobby, ctx)
      default:
        return Default.onBeforeConnect(req, lobby, ctx)
    }
  }

  static async onFetch(
    req: Party.Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) {
    return new Response(req.url, { status: 403 })
  }
}

Server satisfies Party.Worker
