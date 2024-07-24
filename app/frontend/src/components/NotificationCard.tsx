import { FC, useEffect, useState } from 'react'
import { Notification } from '../atoms/notificationsAtom'
import { decryptMessage, deriveSharedSecret } from '../utils/crypto'
import { getSessionKeypair } from '../utils/getSessionKeypair'
import { useUserWallet } from '../atoms/userWalletAtom'

export const NotificationCard: FC<{ notification: Notification }> = ({
  notification,
}) => {
  const wallet = useUserWallet()
  const [message, setMessage] = useState<string | null>(null)
  const [decryptionError, setDecryptionError] = useState<string | null>(null)

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
  }, [wallet, notification.message])

  return (
    <div>
      {message} {decryptionError}
    </div>
  )
}
