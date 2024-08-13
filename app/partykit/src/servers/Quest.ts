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
  sessionAddress: string
  encryptionAddress: string
  taker?: boolean
  owner?: boolean
}

interface Message {
  questId: string
  data: string // base 58 encoded, encrypted
  hash: string // sha256(previous message hash + data, encrypted), backend generated
  prevHash: string
  timestamp: number // backend generated
  senderAddress: string // backend generated
  signature: string // signature of the data (encrypted), using session address
}

interface ClientMessage {
  type: string
  data: string
  signature: string
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
    // await this.room.storage.deleteAll()
    this.authorizedAddresses =
      (await this.room.storage.get('authorizedAddresses')) ?? []
    this.quest = (await this.room.storage.get('quest')) || null
    this.messages = (await this.room.storage.get('messages')) || []
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const address = ctx.request.headers.get('X-User-Address')
    conn.setState({ address })

    if (
      this.authorizedAddresses.find((a) => a.owner) &&
      this.authorizedAddresses.find((a) => a.taker)
    ) {
      const output: ServerResponse = {
        authorizedAddresses: this.authorizedAddresses,
        proposal_hash: this.quest!.offereeProposalHash,
        messages: this.messages,
      }
      this.room.broadcast(JSON.stringify(output))
    } else {
      conn.send(JSON.stringify({ standby: true }))
    }
  }

  async onMessage(
    rawMessage: string | ArrayBufferLike,
    sender: Party.Connection
  ) {
    const clientMessage = JSON.parse(rawMessage.toString()) as ClientMessage
    const senderAddress = (sender.state as { address: string }).address

    if (clientMessage.type !== 'message') {
      switch (clientMessage.type) {
        case 'get_messages': {
          sender.send(JSON.stringify({ messages: this.messages }))
          break
        }
      }
      return
    }

    // verify signature
    const signature = bs58.decode(clientMessage.signature)
    const user = this.authorizedAddresses.find(
      (a) => a.address === senderAddress
    )!
    const sessionAddress = bs58.decode(user.sessionAddress)
    const messageData = new TextEncoder().encode(clientMessage.data)

    if (!sign.detached.verify(messageData, signature, sessionAddress)) {
      throw new Error('Invalid signature')
    }

    // todo: first message hash should be the proposal hash from the quest
    // and should be sent by the taker

    const prevHash =
      this.messages[this.messages.length - 1]?.hash ??
      this.quest!.offereeProposalHash
    const prevHashBytes = bs58.decode(prevHash)

    const data = new Uint8Array(prevHashBytes.length + messageData.length)
    data.set(prevHashBytes)
    data.set(messageData, prevHashBytes.length)

    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data))
    const [, questId] = this.room.id.split('_')
    const message: Message = {
      questId,
      data: clientMessage.data,
      hash: bs58.encode(hash),
      prevHash,
      timestamp: Date.now(),
      senderAddress,
      signature: clientMessage.signature,
    }

    this.messages.push(message)
    await this.room.storage.put('messages', this.messages)

    this.room.broadcast(JSON.stringify({ message }))
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
            sessionAddress: req.headers.get('X-User-Session-Address') ?? '',
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

      const user = this.authorizedAddresses.find(
        (a) => a.address === userAddress
      )

      if (!user) {
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

      return new Response(JSON.stringify(user), {
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

        const [questSessionAddress, encryptionAddress, questSessionSignature] =
          message.split('_')

        if (
          !sign.detached.verify(
            new TextEncoder().encode(
              `${questSessionAddress}_${encryptionAddress}`
            ),
            bs58.decode(questSessionSignature),
            bs58.decode(questSessionAddress)
          )
        ) {
          throw new Error('Invalid quest session signature')
        }

        req.headers.set('X-User-Address', address)
        req.headers.set('X-User-Session-Address', questSessionAddress)
        req.headers.set('X-User-Encryption-Address', encryptionAddress)

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

      if (!authorizedAddresses.some((a) => a.address === address)) {
        throw new Error('Unauthorized')
      }

      req.headers.set('X-User-Address', address)

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
