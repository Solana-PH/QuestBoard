import type * as Party from 'partykit/server'
import type { ServerCommon } from './ServerCommon'
import { commonHeaders } from '../commonHeaders'

export default class QuestInfo implements ServerCommon {
  name = 'questinfo'

  constructor(readonly room: Party.Room) {}

  async onRequest(req: Party.Request) {
    // console.log(await req.json())

    // return new Response('Access denied', { status: 403 })

    // if (req.method === 'GET') return req

    if (req.method === 'POST') {
      // const body = await req.json()
      console.log(await req.json())
    }

    return new Response('Hello', { status: 200, headers: commonHeaders })

    // return new Response('Access denied', { status: 403 })
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
