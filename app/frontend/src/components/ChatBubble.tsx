import { useAtomValue } from 'jotai'
import { FC, Suspense } from 'react'
import { questMessageAtom } from '../atoms/questMessagesAtom'
import { useUserWallet } from '../atoms/userWalletAtom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import cn from 'classnames'
import { trimAddress } from '../utils/trimAddress'

dayjs.extend(relativeTime)

interface ChatBubbleProps {
  hash: string
}

const ChatBubbleInner: FC<ChatBubbleProps> = ({ hash }) => {
  const wallet = useUserWallet()
  const decryptedMessage = useAtomValue(questMessageAtom(hash))

  // todo: useEffect -> if a specific hash message is missing, request it from the server

  if (!wallet?.publicKey) return null
  if (!decryptedMessage) return null

  const isMe = decryptedMessage?.senderAddress === wallet.publicKey.toBase58()
  const since = dayjs(decryptedMessage.timestamp).fromNow()

  return (
    <div className={cn('flex', isMe && 'flex-row-reverse')}>
      <div className={cn('flex flex-col gap-2', isMe && 'justify-end')}>
        {!isMe && (
          <div className='text-xs font-bold opacity-75'>
            {trimAddress(decryptedMessage.senderAddress)}
          </div>
        )}
        <div
          className={cn(
            'px-3 py-2 rounded-lg',
            isMe ? 'bg-white text-black' : 'bg-stone-800 text-white',
            isMe ? 'rounded-br-none' : 'rounded-bl-none'
          )}
        >
          {decryptedMessage.type === 'text' && decryptedMessage.content}
        </div>
        <div className={cn('text-xs', isMe && 'text-right')}>{since}</div>
      </div>
      <div className='w-16 flex-none' />
    </div>
  )
}

export const ChatBubble: FC<ChatBubbleProps> = ({ hash }) => {
  // todo: animate bubble loading

  return (
    <Suspense fallback={null}>
      <ChatBubbleInner hash={hash} />
    </Suspense>
  )
}
