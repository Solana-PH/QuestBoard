import { partykitAddress } from '../constants/partykitAddress'
import { getAccessToken } from './getAccessToken'
import { getSessionKeypair } from './getSessionKeypair'

export const joinQuestRoom = async (address: string, questId: string) => {
  const keypair = getSessionKeypair(address)
  if (!keypair) throw Error('No session keypair found')

  const token = [address, getAccessToken(keypair)].join('.')

  return fetch(`${partykitAddress}/parties/main/quest_${questId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Authorization: token,
    },
  })
}
