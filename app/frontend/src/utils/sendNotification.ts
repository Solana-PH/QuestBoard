import { UserDetails } from '../atoms/userDetailsAtom'
import { partykitAddress } from '../constants/partykitAddress'
import { deriveSharedSecret, encryptMessage } from './crypto'
import { getAccessToken } from './getAccessToken'
import { getSessionKeypair } from './getSessionKeypair'

export const sendNotification = async (
  from: string,
  to: string,
  message: string,
  messageType: string
) => {
  const keypair = getSessionKeypair(from)
  if (!keypair) throw Error('No session keypair found')

  const token = [from, getAccessToken(keypair)].join('.')

  // fetch user details to get the recipient's session address
  const response = await fetch(
    `${partykitAddress}/parties/main/userinfo_${to}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (response.status === 404) {
    throw Error('Recipient not found')
  }

  const details = (await response.json()) as UserDetails
  const notifAddress = details.notifAddress

  if (!notifAddress) throw Error('Recipient notification address not found')

  // encrypt the message
  const sharedSecret = await deriveSharedSecret(keypair, notifAddress)
  const encrypted = await encryptMessage(message, sharedSecret)

  return fetch(`${partykitAddress}/parties/main/user_${to}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Authorization: token,
      'X-Message-Type': messageType,
    },
    body: encrypted,
  })
}
