import { useParams } from 'react-router-dom'
import { useUserWallet } from '../atoms/userWalletAtom'
import { FC, ReactNode, useEffect, useMemo, useState } from 'react'
import { partykitAddress } from '../constants/partykitAddress'
import { joinQuestRoom } from '../utils/joinQuestRoom'
import cn from 'classnames'
import { SignIn } from '@phosphor-icons/react'
import { useAtomValue } from 'jotai'
import { idbAtom } from '../atoms/idbAtom'

export interface AuthorizedAddress {
  address: string
  sessionAddress: string
  encryptionAddress: string
  taker?: boolean
  owner?: boolean
}

export const ChatGate: FC<{ children: ReactNode }> = ({ children }) => {
  const idb = useAtomValue(idbAtom)
  const { questId } = useParams()
  const wallet = useUserWallet()
  const address = wallet?.publicKey?.toBase58() ?? ''
  const [authorizedAddresses, setAuthorizedAddresses] = useState<
    AuthorizedAddress[] | null
  >(null)
  const [busy, setBusy] = useState(false)

  const fetchAuthorizedAddresses = async () => {
    if (!questId) return
    const response = await fetch(
      `${partykitAddress}/parties/main/quest_${questId}`
    )
    const data = await response.json()
    setAuthorizedAddresses(data)
  }

  useEffect(() => {
    fetchAuthorizedAddresses()
  }, [questId])

  const joined = useMemo(() => {
    if (!authorizedAddresses) return false
    return authorizedAddresses.some((a) => a.address === address)
  }, [address, authorizedAddresses])

  const join = async () => {
    if (!idb) return
    if (!questId) return
    if (!address) return
    if (joined) return
    setBusy(true)
    try {
      const sessionKeypair = await joinQuestRoom(address, questId)
      if (sessionKeypair) {
        await idb.put('session_keys', {
          id: sessionKeypair.publicKey.toBase58(),
          downloaded: false,
          keypair: sessionKeypair.secretKey,
        })
      }
      fetchAuthorizedAddresses()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  if (authorizedAddresses === null || idb === null) {
    return (
      <>
        <div className='flex flex-col gap-5 flex-auto p-5'>
          <div className='flex flex-col gap-2'>
            <h2 className='h-10 w-64 bg-amber-950/50 animate-pulse rounded' />
            <h2 className='h-5 w-56 bg-amber-950/50 animate-pulse rounded' />
          </div>
          <div className='flex flex-col gap-2'>
            <div className='h-6 w-72 bg-amber-950/50 animate-pulse rounded' />
            <div className='h-6 w-64 bg-amber-950/50 animate-pulse rounded' />
          </div>
          <div className='flex flex-col gap-2'>
            <div className='h-6 w-36 bg-amber-950/50 animate-pulse rounded' />
            <div className='h-6 w-64 bg-amber-950/50 animate-pulse rounded' />
          </div>
        </div>
      </>
    )
  }

  if (!joined) {
    return (
      <div className='flex flex-col gap-5 flex-auto p-5 items-center justify-center'>
        <div className='bg-black/50 text-white'>
          <button
            onClick={join}
            disabled={busy}
            className={cn(
              busy
                ? 'opacity-50 pointer-events-none cursor-wait'
                : 'cursor-pointer',
              'w-full px-3 py-2 flex items-center justify-center gap-3',
              'bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
            )}
          >
            <SignIn size={32} />
            <span>{busy ? 'Please Wait' : 'Join Room'}</span>
          </button>
        </div>
      </div>
    )
  }

  return children
}
