import type * as Party from 'partykit/server'
import type { ServerCommon } from './ServerCommon'
import { commonHeaders } from '../commonHeaders'

import bs58 from 'bs58'
import { sign } from 'tweetnacl'
import { decodeQuestData, type QuestData } from '../decodeQuestData'
import { getAccountData } from '../getAccountData'
import { getUserDetails } from '../getUserDetails'

interface AuthorizedAddress {
  address: string
  sessionAdress: string
  encryptionAddress: string
  taker?: boolean
  owner?: boolean
}

interface Message {
  data: string // base 58 encoded, encrypted
  hash: string // sha256(previous message hash + data, encrypted), backend generated
  timestamp: number // backend generated
  senderAddress: string // backend generated
  signature: string // signature of the data (encrypted), using session address
}

interface ServerResponse {
  authorizedAddresses?: AuthorizedAddress[]
  messages?: Message[]
  proposal_hash?: string
}

export default class Quest implements ServerCommon {
  name = 'quest'
  authorizedAddresses: AuthorizedAddress[] = []
  quest: QuestData | null = null
  messages: Message[] = []

  // todo:
  // implement file system

  constructor(readonly room: Party.Room) {}

  async onStart() {
    this.authorizedAddresses =
      (await this.room.storage.get('authorizedAddresses')) ?? []
    this.quest = (await this.room.storage.get('quest')) || null
    this.messages = (await this.room.storage.get('messages')) || []
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    if (
      this.authorizedAddresses.find((a) => a.owner) &&
      this.authorizedAddresses.find((a) => a.taker)
    ) {
      const output: ServerResponse = {
        authorizedAddresses: this.authorizedAddresses,
        proposal_hash: this.quest!.offereeProposalHash,
      }
      this.room.broadcast(JSON.stringify(output))
    } else {
      conn.send(JSON.stringify({ standby: true }))
    }
  }

  async onMessage(message: string | ArrayBufferLike, sender: Party.Connection) {
    // todo: first message hash should be the proposal hash from the quest
    // and should be sent by the taker
    this.room.broadcast(message)
  }

  async onRequest(req: Party.Request) {
    const [, address] = this.room.id.split('_')

    if (req.method === 'GET') {
      return new Response(JSON.stringify(this.authorizedAddresses), {
        status: 200,
        headers: commonHeaders,
      })
    } else if (req.method === 'POST') {
      const accountData = await getAccountData(address)

      if (accountData === null) throw new Error('Account not found')

      const quest = this.quest ?? decodeQuestData(accountData)

      const userAddress = req.headers.get('X-User-Address') ?? ''

      if (!this.authorizedAddresses.some((a) => a.address === userAddress)) {
        if (userAddress === quest.owner || userAddress === quest.offeree) {
          this.authorizedAddresses.push({
            address: userAddress,
            sessionAdress: req.headers.get('X-User-Session-Address') ?? '',
            encryptionAddress:
              req.headers.get('X-User-Encryption-Address') ?? '',
            taker: userAddress === quest.offeree,
            owner: userAddress === quest.owner,
          })
          await this.room.storage.put(
            'authorizedAddresses',
            this.authorizedAddresses
          )
        }
      }

      if (!this.authorizedAddresses.some((a) => a.address === userAddress)) {
        return new Response('Access denied', {
          status: 403,
          headers: commonHeaders,
        })
      }

      if (!this.quest) {
        this.quest = quest
        await this.room.storage.put('quest', quest)
      }

      // todo: store signal pre-keys

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
        req.headers.set('X-User-Session-Address', userDetails.sessionAddress)
        req.headers.set('X-User-Encryption-Address', userDetails.notifAddress)

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

    try {
      const token = new URL(req.url).searchParams.get('token') ?? ''
      const [, questId] = lobby.id.split('_')

      if (!token) {
        throw new Error('Token not provided')
      }

      const [address, message, signature] = token.split('.')
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

      const room = lobby.parties.main.get(`quest_${questId}`)

      const remote = await room.fetch({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!remote.ok) {
        throw new Error('Error fetching user session')
      }

      const authorizedAddresses = (await remote.json()) as AuthorizedAddress[]

      if (
        !authorizedAddresses.some(
          (a) =>
            a.address === address &&
            a.sessionAdress === userDetails.sessionAddress
        )
      ) {
        throw new Error('Unauthorized')
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
