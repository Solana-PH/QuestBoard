import type { Stub } from 'partykit/server'

export interface UserDetails {
  sessionAddress: string
  notifAddress: string
  signature: string
  availableStart: string
  availableEnd: string
}

export const getUserDetails = async (room: Stub): Promise<UserDetails> => {
  const remote = await room.fetch({
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!remote.ok) {
    throw new Error('Error fetching visitor session')
  }

  return remote.json()
}
