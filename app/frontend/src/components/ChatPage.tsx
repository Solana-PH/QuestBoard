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
import { useAtom, useAtomValue } from 'jotai'
import { ChatMessage, questMessagesAtom } from '../atoms/questMessagesAtom'
import { PublicKey } from '@solana/web3.js'

interface ServerMessage {
  authorizedAddresses?: AuthorizedAddress[]
  messages?: ChatMessage[]
  proposal_hash?: string
  standby?: boolean
  message?: ChatMessage
}

const ChatPageInner: FC = () => {
  const idb = useAtomValue(idbAtom)
  const { questId } = useParams()
  const wallet = useUserWallet()
  const address = wallet?.publicKey?.toBase58() ?? ''
  const [message, setMessage] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [messages, messageAction] = useAtom(questMessagesAtom(questId ?? ''))
  const [keypairNotFound, setKeypairNotFound] = useState(false)

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

      if (
        !initialized &&
        serverMessage.authorizedAddresses &&
        serverMessage.proposal_hash
      ) {
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

        // store the sessionKeypair used for this quest
        const sessionKeypair = getSessionKeypair(address)

        const sessionAddressUsed =
          owner.address === address
            ? owner.sessionAddress
            : taker.sessionAddress

        if (
          !sessionKeypair ||
          !sessionKeypair.publicKey.equals(new PublicKey(sessionAddressUsed))
        ) {
          // todo: session keypair not found
          setKeypairNotFound(true)
          return
        }

        setKeypairNotFound(false)

        if (serverMessage.messages) {
          messageAction({ type: 'set', messages: serverMessage.messages })
        }

        setInitialized(true)
      }

      if (initialized && serverMessage.message) {
        messageAction({ type: 'add', message: serverMessage.message })
      }
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
        <div className='flex flex-col gap-5'>{JSON.stringify(messages)}</div>
      </div>
      <form
        className='flex-none px-5 pb-5 flex'
        onSubmit={(e) => {
          e.preventDefault()
          if (!address) return
          if (!idb) return
          if (!questId) return
          if (!message) return

          messageAction({
            type: 'encrypt',
            message: {
              type: 'text',
              message,
            },
            callback: (clientMessage) => {
              ws.send(
                JSON.stringify({
                  ...clientMessage,
                  type: 'message',
                })
              )
              setMessage('')
            },
          })
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
            disabled={!initialized}
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
      {!initialized && (
        <div className='absolute inset-0 bg-white/80 flex items-center justify-center p-5 text-center'>
          {keypairNotFound ? (
            <div className='text-red-500'>
              The session keypair used for this quest was not found in this
              device.
            </div>
          ) : (
            <>Please wait...</>
          )}
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
