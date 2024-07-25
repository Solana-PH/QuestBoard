import { FC, ReactNode, useEffect, useMemo, useState } from 'react'
import { Notification, NotificationMessage } from '../atoms/notificationsAtom'
import { decryptMessage, deriveSharedSecret } from '../utils/crypto'
import { getSessionKeypair } from '../utils/getSessionKeypair'
import { useUserWallet } from '../atoms/userWalletAtom'
import { trimAddress } from '../utils/trimAddress'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAtomValue } from 'jotai'
import { userConnectionStatusAtom } from '../atoms/userConnectionStatusAtom'
import cn from 'classnames'
import { TrashSimple, Warning } from '@phosphor-icons/react'
import { questAtom } from '../atoms/questsAtom'
import { Link } from 'react-router-dom'
import { formatNumber } from '../utils/formatNumber'
import { myRoomWebsocketAtom } from '../atoms/myRoomWebsocketAtom'

dayjs.extend(relativeTime)

const Card: FC<{
  children: ReactNode
  fromAddress: string
  isOnline: boolean
  since: string
  onDelete: () => void
}> = ({ children, fromAddress, isOnline, since, onDelete }) => {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex justify-between'>
        <span className='flex items-center gap-2 text-sm'>
          <span className='font-bold'>{fromAddress}</span>
          <span
            className={cn(
              isOnline ? 'bg-green-500' : 'bg-red-500',
              'rounded-full w-2 h-2 flex-none'
            )}
          />
          <span>{since}</span>
        </span>
        <div className='flex items-center gap-2'>
          <button onClick={onDelete}>
            <TrashSimple size={16} />
          </button>
        </div>
      </div>
      {children}
      <div className='border-b border-dashed border-black/25 mt-3 mb-5' />
    </div>
  )
}

export const NotificationCard: FC<{ notification: Notification }> = ({
  notification,
}) => {
  const wallet = useUserWallet()
  const [message, setMessage] = useState<string | null>(null)
  const [decryptionError, setDecryptionError] = useState<string | null>(null)
  const isVisitorOnline = useAtomValue(
    userConnectionStatusAtom(notification.visitorAddress)
  )
  const messageDetails = useMemo(() => {
    if (!message) return null
    try {
      return JSON.parse(message) as NotificationMessage
    } catch (e) {
      return null
    }
  }, [message, notification.messageType])
  const questDetails = useAtomValue(questAtom(messageDetails?.quest ?? ''))
  const ws = useAtomValue(myRoomWebsocketAtom)

  const since = dayjs(notification.timestamp).fromNow()

  useEffect(() => {
    if (!wallet?.publicKey) return
    if (!notification.message) return

    const keypair = getSessionKeypair(wallet.publicKey.toBase58())

    if (!keypair) {
      setDecryptionError('Session keypair does not exists.')
      return
    }

    deriveSharedSecret(keypair, notification.visitorNotifAddress)
      .then((secret) => {
        return decryptMessage(notification.message, secret)
      })
      .then((decryptedMessage) => {
        setMessage(decryptedMessage)
      })
      .catch((e) => {
        console.error(e)
        setDecryptionError('Unable to decrypt message.')
      })
  }, [wallet, notification.message, notification.visitorNotifAddress])

  const onDelete = () => {
    if (!ws) return
    ws.send(
      JSON.stringify({
        type: 'delete_notification',
        id: notification.id,
      })
    )
  }

  if (decryptionError) {
    return (
      <Card
        fromAddress={trimAddress(notification.visitorAddress)}
        isOnline={isVisitorOnline ?? false}
        since={since}
        onDelete={onDelete}
      >
        <p className='text-red-500 flex gap-2 items-center'>
          <Warning size={20} />
          <span>{decryptionError}</span>
        </p>
      </Card>
    )
  }

  return (
    <Card
      fromAddress={trimAddress(notification.visitorAddress)}
      isOnline={isVisitorOnline ?? false}
      since={since}
      onDelete={onDelete}
    >
      {messageDetails ? (
        <div className='flex flex-col gap-3'>
          <p className='text-black'>{messageDetails.content}</p>
          {questDetails?.details && (
            <div className='flex flex-col gap-2 text-xs'>
              <div className='flex items-center gap-2'>
                <span>For Quest: </span>
                <span className='font-bold flex items-center gap-2'>
                  <Link
                    to={`/quest/${messageDetails.quest}`}
                    className='text-sm font-bold break-words'
                  >
                    {questDetails.details.title}
                  </Link>
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span>Stake Offered: </span>
                <span className='font-bold flex items-center gap-2'>
                  {messageDetails.minStake === 0
                    ? 'None'
                    : formatNumber(messageDetails.minStake + '')}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p></p>
      )}
    </Card>
  )
}
