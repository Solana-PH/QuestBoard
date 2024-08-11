import { FC, Suspense, useState } from 'react'
import { PagePanel } from './PagePanel'
import { AuthorizedAddress, ChatGate } from './ChatGate'
import { PaperPlaneRight } from '@phosphor-icons/react'
import cn from 'classnames'
import usePartySocket from 'partysocket/react'
import { partykitAddress } from '../constants/partykitAddress'
import { useParams } from 'react-router-dom'
import { getSessionKeypair } from '../utils/getSessionKeypair'
import { getAccessToken } from '../utils/getAccessToken'
import { useUserWallet } from '../atoms/userWalletAtom'
import { idbAtom } from '../atoms/idbAtom'
import { useAtomValue } from 'jotai'

interface ChatMessage {
  data: string // base 58 encoded, encrypted
  hash: string // sha256(previous message hash + data, encrypted), backend generated
  timestamp: number // backend generated
  senderAddress: string // backend generated
  signature: string // signature of the data (encrypted), using session address
}

interface ServerMessage {
  authorizedAddresses?: AuthorizedAddress[]
  messages?: ChatMessage[]
  proposal_hash?: string
  standby?: boolean
}

const ChatPageInner: FC = () => {
  const idb = useAtomValue(idbAtom)
  const { questId } = useParams()
  const wallet = useUserWallet()
  const address = wallet?.publicKey?.toBase58() ?? ''
  const [message, setMessage] = useState('')
  const [onStandby, setOnStandby] = useState(true)

  const ws = usePartySocket({
    host: partykitAddress,
    room: `quest_${questId}`,

    query: async () => {
      if (!address) return {}
      const keypair = getSessionKeypair(address)

      if (!keypair) return {}
      const token = [address, getAccessToken(keypair)].join('.')

      return {
        token,
      }
    },

    onOpen() {
      console.log('quest ws connected')
    },
    async onMessage(e) {
      console.log('quest ws message', e.data)

      const serverMessage = JSON.parse(e.data || 'null') as ServerMessage | null

      if (!serverMessage) return

      if (serverMessage.authorizedAddresses && serverMessage.proposal_hash) {
        if (!questId) return
        if (!idb) return

        const quest = await idb.get('quest', questId)
        const proposal = (await idb.get(
          'proposal_hash',
          serverMessage.proposal_hash
        ))!

        const owner = serverMessage.authorizedAddresses.find((a) => a.owner)!
        const taker = serverMessage.authorizedAddresses.find((a) => a.taker)!

        const patchedQuest = {
          id: questId,
          ...quest,
          owner: {
            ...quest?.owner,
            ...owner,
          },
          taker: {
            ...quest?.taker,
            ...taker,
          },
          messages: [...(quest?.messages || [])],
          proposal,
        }

        await idb.put('quest', patchedQuest)

        setOnStandby(false)
      }

      // messages atom (getter, setter)
      // decrypt messages
    },
    onClose() {
      console.log('quest ws closed')
    },
    onError(e) {
      console.log('quest ws error', e)
    },
  })

  return (
    <div className='flex flex-col h-full overflow-hidden relative'>
      <div className='flex-auto overflow-y-auto overflow-x-hidden p-5'>
        <div className='flex flex-col gap-5'></div>
      </div>
      <form
        className='flex-none px-5 pb-5 flex'
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <input
          autoFocus
          type='text'
          className='w-full bg-black/5 px-3 py-2'
          value={message}
          onChange={(e) => setMessage(e.target.value.substring(0, 120))}
        />
        <div className='bg-black/50 text-white'>
          <button
            type='submit'
            disabled={onStandby}
            className={cn(
              'cursor-pointer',
              'w-full px-3 py-2 flex items-center justify-center gap-3',
              'bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
            )}
          >
            <PaperPlaneRight size={32} />
          </button>
        </div>
      </form>
      {onStandby && (
        <div className='absolute inset-0 bg-white/80 flex items-center justify-center p-5 text-center'>
          Please wait...
        </div>
      )}
    </div>
  )
}

export const ChatPage: FC = () => {
  return (
    <PagePanel className='md:w-[32rem]'>
      <Suspense
        fallback={
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
        }
      >
        <ChatGate>
          <ChatPageInner />
        </ChatGate>
      </Suspense>
    </PagePanel>
  )
}
