import type * as Party from 'partykit/server'
import type { ServerCommon } from './ServerCommon'
import { commonHeaders } from '../commonHeaders'
import bs58 from 'bs58'
import { sign } from 'tweetnacl'

interface UserDetails {
  sessionAddress: string
  signature: string
  availableStart: string
  availableEnd: string
}

export default class User implements ServerCommon {
  name = 'user'

  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // conn.close()
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
    if (req.method === 'OPTIONS')
      return new Response(null, {
        status: 200,
        headers: commonHeaders,
      })

    return req
  }

  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    if (req.method === 'OPTIONS')
      return new Response(null, {
        status: 200,
        headers: commonHeaders,
      })

    try {
      const token = new URL(req.url).searchParams.get('token') ?? ''
      const [, address] = lobby.id.split('_')

      if (!token) {
        throw new Error('Token not provided')
      }

      const [message, signature] = token.split('.')

      const remote = await fetch(
        `http://192.168.1.32:1999/parties/main/userinfo_${address}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!remote.ok) {
        throw new Error('Error fetching user session')
      }

      const userDetails = (await remote.json()) as UserDetails
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

      return req
    } catch (e) {
      console.error(e)
      return new Response('Unauthorized', {
        status: 401,
        headers: commonHeaders,
      })
    }
  }
}
