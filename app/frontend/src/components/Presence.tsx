import { useAtomValue, useSetAtom } from 'jotai'
import usePartySocket from 'partysocket/react'
import { FC, useEffect, useRef } from 'react'
import { myDetailsAtom, UserDetails } from '../atoms/userDetailsAtom'
import { useUserWallet } from '../atoms/userWalletAtom'
import { WalletContextState } from '@solana/wallet-adapter-react'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import { sign } from 'tweetnacl'
import {
  ConnectionStatus,
  connectionStatusAtom,
} from '../atoms/connectionStatusAtom'
import { partykitAddress } from '../constants/partykitAddress'
import { presenceRawAtom } from '../atoms/presenceAtom'

const PresenceInner: FC<{
  details: UserDetails
  wallet: WalletContextState
}> = ({ wallet }) => {
  // must have the session keypair
  // consults own room
  // own room do POST request presence server
  const address = wallet.publicKey?.toBase58()
  const setConnectionStatus = useSetAtom(connectionStatusAtom)
  const setPresence = useSetAtom(presenceRawAtom)

  const ws = usePartySocket({
    host: partykitAddress,
    room: `user_${address}`,

    query: async () => {
      // using the session keypair, sign the date today and a nonce
      const sessionKeypair = window.localStorage.getItem(
        `session_keypair_${address}`
      )
      if (!sessionKeypair) return {}

      const keypair = Keypair.fromSecretKey(bs58.decode(sessionKeypair))
      const nonce = Keypair.generate().publicKey.toBase58()
      const today = Date.now()
      const message = `${today}_${nonce}`
      const signature = sign.detached(Buffer.from(message), keypair.secretKey)

      return {
        token: `${message}.${bs58.encode(signature)}`,
      }
    },

    onOpen() {
      console.log('ws connected')
      setConnectionStatus(ConnectionStatus.CONNECTED)
    },
    onMessage(e) {
      console.log('ws message', e.data)
    },
    onClose() {
      console.log('ws closed')
      setConnectionStatus(ConnectionStatus.CONNECTING)
    },
    onError(e) {
      console.log('ws error', e)
    },
  })

  usePartySocket({
    host: partykitAddress,
    room: 'presence',

    onMessage(e) {
      const connections = (JSON.parse(e.data) ?? []).sort()
      setPresence(JSON.stringify(connections))
    },

    onError() {
      // todo: possibly fetch presence endpoint instead
    },
  })

  const heartbeat = useRef(-1)
  useEffect(() => {
    if (!ws) return

    if (heartbeat.current !== -1) {
      window.clearInterval(heartbeat.current)
    }

    heartbeat.current = window.setInterval(() => {
      ws.send(JSON.stringify({ type: 'heartbeat' }))
    }, 1000 * 5)

    return () => {
      window.clearInterval(heartbeat.current)
    }
  }, [ws])

  return null
}

export const Presence: FC = () => {
  const info = useAtomValue(myDetailsAtom)
  const wallet = useUserWallet()

  if (!wallet?.publicKey) return null
  if (typeof info === 'string' || !info) return null

  return <PresenceInner details={info} wallet={wallet} />
}
