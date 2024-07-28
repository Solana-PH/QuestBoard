import { useAtomValue, useSetAtom } from 'jotai'
import usePartySocket from 'partysocket/react'
import { FC, useEffect, useRef } from 'react'
import { myDetailsAtom, UserDetails } from '../atoms/userDetailsAtom'
import { useUserWallet } from '../atoms/userWalletAtom'
import { WalletContextState } from '@solana/wallet-adapter-react'

import {
  ConnectionStatus,
  connectionStatusAtom,
} from '../atoms/connectionStatusAtom'
import { partykitAddress } from '../constants/partykitAddress'
import { presenceRawAtom } from '../atoms/presenceAtom'
import { getAccessToken } from '../utils/getAccessToken'
import { getSessionKeypair } from '../utils/getSessionKeypair'
import {
  Notification,
  NotificationMessageType,
  notificationsAtom,
} from '../atoms/notificationsAtom'
import { myRoomWebsocketAtom } from '../atoms/myRoomWebsocketAtom'
import { trimAddress } from '../utils/trimAddress'
import { blockedAddressesAtom } from '../atoms/blockedAddressesAtom'

// todo: https://www.youtube.com/watch?v=Bm0JjR4kP8w
// https://chatgpt.com/c/969d9a40-6af0-4c7e-bbcf-1734d1fbbba9
// https://chatgpt.com/c/9b5ca61d-d053-4fcd-89dc-24e7dc7551ca

type ServerMessage =
  | {
      type: 'notification'
      notification: Notification
    }
  | {
      type: 'notifications'
      notifications: Notification[]
    }
  | {
      type: 'delete_notification'
      notificationId: string
    }
  | {
      type: 'blocklist'
      list: string[]
    }

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
  const setNotifs = useSetAtom(notificationsAtom)
  const setRoom = useSetAtom(myRoomWebsocketAtom)
  const setBlockList = useSetAtom(blockedAddressesAtom)

  // move this to service worker
  const ws = usePartySocket({
    host: partykitAddress,
    room: `user_${address}`,

    query: async () => {
      if (!address) return {}
      const keypair = getSessionKeypair(address)

      if (!keypair) return {}
      const token = getAccessToken(keypair)

      return {
        token,
      }
    },

    onOpen() {
      console.log('ws connected')
      setConnectionStatus(ConnectionStatus.CONNECTED)
    },
    onMessage(e) {
      // console.log('ws message', e.data)
      const partykitMessage = JSON.parse(
        e.data || 'null'
      ) as ServerMessage | null
      if (partykitMessage) {
        switch (partykitMessage.type) {
          case 'notification':
            setNotifs((prev) => [...prev, partykitMessage.notification])
            if (window.Notification.permission === 'granted') {
              let body = ''
              switch (partykitMessage.notification.messageType) {
                case NotificationMessageType.QUEST_PROPOSAL:
                  body = `Quest Proposal`
                  break
                case NotificationMessageType.QUEST_ACCEPTED:
                  body = `Quest Accepted`
                  break
                case NotificationMessageType.QUEST_REJECTED:
                  body = `Quest Rejected`
                  break
              }

              new window.Notification(
                `From ${trimAddress(
                  partykitMessage.notification.visitorAddress
                )}`,
                {
                  body,
                  icon: '/QuestBoardLogo_blackandwhite.png',
                }
              )
            }
            break
          case 'notifications':
            setNotifs(partykitMessage.notifications)
            break
          case 'delete_notification':
            setNotifs((prev) =>
              prev.filter((n) => n.id !== partykitMessage.notificationId)
            )
            break
          case 'blocklist':
            setBlockList(partykitMessage.list)
            break
        }
      }
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

  // todo: move this to service worker
  const heartbeat = useRef(-1)
  useEffect(() => {
    setRoom(ws ?? null)
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
