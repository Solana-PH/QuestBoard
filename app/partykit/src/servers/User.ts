import type * as Party from 'partykit/server'
import type { ServerCommon } from './ServerCommon'
import { commonHeaders } from '../commonHeaders'
import bs58 from 'bs58'
import { sign } from 'tweetnacl'
import { getUserDetails } from '../getUserDetails'

interface Notification {
  message: string
  messageType: string
  visitorAddress: string
  visitorSessionAddress: string
  timestamp: number
}

export default class User implements ServerCommon {
  name = 'user'
  connected = false
  notifications = new Map<string, Notification>([])

  constructor(readonly room: Party.Room) {}

  async onStart() {
    this.notifications = new Map(
      (await this.room.storage.get('notifications')) ?? []
    )
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.room.storage.put(`heartbeat`, Date.now())
    this.connected = true
    this.updateConnections('connect')
  }

  async onClose(conn: Party.Connection) {
    this.connected = false
    this.updateConnections('disconnect')
  }

  async updateConnections(type: 'connect' | 'disconnect') {
    const main = this.room.context.parties.main
    const presenceRoom = main.get('presence')
    const [, address] = this.room.id.split('_')
    // TODO: add a password
    await presenceRoom.fetch({
      method: 'POST',
      body: JSON.stringify([
        {
          type,
          address,
        },
      ]),
    })
  }

  async onRequest(req: Party.Request) {
    if (req.method === 'GET') {
      // check last heartbeat and disconnect more than 10 seconds of no response
      const heartbeat = parseInt(
        (await this.room.storage.get(`heartbeat`)) + ''
      )

      if (!heartbeat || Date.now() - heartbeat > 10000) {
        this.connected = false
      }

      return new Response(
        JSON.stringify({
          online: this.connected,
          heartbeat,
        }),
        { status: 200, headers: commonHeaders }
      )
    } else if (req.method === 'POST') {
      const visitorAddress = req.headers.get('X-Visitor-Address') ?? ''
      const visitorSessionAddress =
        req.headers.get('X-Visitor-Session-Address') ?? ''
      const messageType = req.headers.get('X-Message-Type') ?? ''

      if (visitorAddress && visitorSessionAddress && messageType) {
        // notification message
        // note: message should be encrypted right before being submitted here

        const message = await req.text()
        const content: Notification = {
          message,
          messageType,
          visitorAddress,
          visitorSessionAddress,
          timestamp: Date.now(),
        }
        this.notifications.set(visitorAddress, content)

        // broadcast
        this.room.broadcast(
          JSON.stringify({
            type: 'notification',
            notification: content,
          })
        )

        await this.room.storage.put(
          `notifications`,
          Array.from(this.notifications.entries())
        )

        return new Response('Ok', { status: 200, headers: commonHeaders })
      }
    }

    return new Response('Access denied', {
      status: 403,
      headers: commonHeaders,
    })
  }

  async onMessage(
    messageStr: string | ArrayBufferLike,
    sender: Party.Connection
  ) {
    const message = JSON.parse(messageStr as string)

    switch (message.type) {
      case 'get_notifications':
        this.room.broadcast(
          JSON.stringify({
            type: 'notifications',
            notifications: Array.from(this.notifications.values()),
          })
        )
      case 'clear_notifications':
        this.notifications.clear()
        await this.room.storage.put(`notifications`, [])
        break
    }

    this.room.storage.put(`heartbeat`, Date.now())
    // restore the state
    if (!this.connected) {
      this.connected = true
      this.updateConnections('connect')
    }
  }

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

    if (req.method === 'POST') {
      try {
        // verify visitor token
        const token = req.headers.get('Authorization') ?? ''

        if (!token) {
          throw new Error('Token not provided')
        }

        const [visitorAddress, message, signature] = token.split('.')
        const main = lobby.parties.main
        const visitorInfo = main.get(`userinfo_${visitorAddress}`)
        const visitorDetails = await getUserDetails(visitorInfo)
        const sessionAddress = bs58.decode(visitorDetails.sessionAddress)

        if (
          !sign.detached.verify(
            new TextEncoder().encode(message),
            bs58.decode(signature),
            sessionAddress
          )
        ) {
          throw new Error('Invalid signature')
        }

        req.headers.set('X-Visitor-Address', visitorAddress)
        req.headers.set(
          'X-Visitor-Session-Address',
          visitorDetails.sessionAddress
        )

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
      // todo: verify message `${today}_${nonce}`
      // message should be around 5 mins old
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
