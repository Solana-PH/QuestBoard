import type * as Party from 'partykit/server'
import type { ServerCommon } from './servers/ServerCommon'
import { commonHeaders } from './commonHeaders'
import Chat from './servers/Chat'
import Core from './servers/Core'
import Default from './servers/Default'
import QuestInfo from './servers/QuestInfo'
import UserInfo from './servers/UserInfo'
import User from './servers/User'
import Presence from './servers/Presence'
import Quest from './servers/Quest'

export default class Server implements Party.Server {
  readonly server: ServerCommon

  constructor(readonly room: Party.Room) {
    const [role] = room.id.toLowerCase().trim().split('_')

    switch (role) {
      case 'core':
        this.server = new Core(room)
        break
      case 'user':
        this.server = new User(room)
        break
      case 'chat':
        this.server = new Chat(room)
        break
      case 'questinfo':
        this.server = new QuestInfo(room)
        break
      case 'quest':
        this.server = new Quest(room)
        break
      case 'userinfo':
        this.server = new UserInfo(room)
        break
      case 'presence':
        this.server = new Presence(room)
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
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: commonHeaders,
      })
    }

    return (
      this.server.onRequest?.(req) ??
      new Response('Access denied', { status: 403, headers: commonHeaders })
    )
  }

  async onAlarm() {
    return this.server.onAlarm?.()
  }

  static async onCron(
    cron: Party.Cron,
    lobby: Party.CronLobby,
    ctx: Party.ExecutionContext
  ) {
    try {
      const presenceRoom = lobby.parties.main.get('presence')
      const req = await presenceRoom.fetch({ method: 'GET' })
      const connections = (await req.json()) as string[]

      if (req.ok && connections.length > 0) {
        // disconnect inactive users
        const result = (
          await Promise.all(
            connections.map(async (address) => {
              const userRoom = lobby.parties.main.get(`user_${address}`)
              const userResponse = await userRoom.fetch({ method: 'GET' })
              const userStatus = (await userResponse.json()) as {
                online: boolean
                heartbeat: number
              }

              return {
                type: userStatus.online ? 'connect' : 'disconnect',
                address,
              }
            })
          )
        ).filter((update) => update.type === 'disconnect')

        if (result.length > 0) {
          await presenceRoom.fetch({
            method: 'POST',
            body: JSON.stringify(result),
          })
        }
      }

      return new Response('Ok', { status: 200, headers: commonHeaders })
    } catch (e) {
      return new Response('Not Ok: ' + e, {
        status: 200,
        headers: commonHeaders,
      })
    }
  }

  static async onBeforeRequest(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    const [role] = lobby.id.toLowerCase().trim().split('_')
    switch (role) {
      case 'core':
        return Core.onBeforeRequest(req, lobby, ctx)
      case 'user':
        return User.onBeforeRequest(req, lobby, ctx)
      case 'chat':
        return Chat.onBeforeRequest(req, lobby, ctx)
      case 'questinfo':
        return QuestInfo.onBeforeRequest(req, lobby, ctx)
      case 'quest':
        return Quest.onBeforeRequest(req, lobby, ctx)
      case 'userinfo':
        return UserInfo.onBeforeRequest(req, lobby, ctx)
      case 'presence':
        return Presence.onBeforeRequest(req, lobby, ctx)
      default:
        return Default.onBeforeRequest(req, lobby, ctx)
    }
  }

  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    const [role] = lobby.id.toLowerCase().trim().split('_')
    switch (role) {
      case 'core':
        return Core.onBeforeConnect(req, lobby, ctx)
      case 'user':
        return User.onBeforeConnect(req, lobby, ctx)
      case 'chat':
        return Chat.onBeforeConnect(req, lobby, ctx)
      case 'questinfo':
        return QuestInfo.onBeforeConnect(req, lobby, ctx)
      case 'quest':
        return Quest.onBeforeConnect(req, lobby, ctx)
      case 'userinfo':
        return UserInfo.onBeforeConnect(req, lobby, ctx)
      case 'presence':
        return Presence.onBeforeConnect(req, lobby, ctx)
      default:
        return Default.onBeforeConnect(req, lobby, ctx)
    }
  }

  static async onFetch(
    req: Party.Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) {
    return new Response(req.url, { status: 403, headers: commonHeaders })
  }
}

Server satisfies Party.Worker
