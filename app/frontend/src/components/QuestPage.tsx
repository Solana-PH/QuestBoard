import cn from 'classnames'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollableContent } from './ScrollableContent'
import { Link, useParams } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { useAtomValue } from 'jotai'
import { questAtom } from '../atoms/questsAtom'
import { formatNumber } from '../utils/formatNumber'
import { useUserWallet } from '../atoms/userWalletAtom'

export const QuestPage: FC = () => {
  const { questId } = useParams()
  const wallet = useUserWallet()

  const questDetailsRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const quest = useAtomValue(questAtom(questId))

  useEffect(() => {
    if (questDetailsRef.current) {
      const rect = questDetailsRef.current.getBoundingClientRect()
      const listener = () => setWidth(rect.width)
      window.addEventListener('resize', listener)

      listener()

      return () => window.removeEventListener('resize', listener)
    }
  }, [setWidth])

  return (
    <div
      className={cn(
        'absolute inset-0',
        'flex justify-end',
        'overflow-x-scroll overflow-y-hidden',
        'gap-3 p-3 lg:gap-5 lg:p-5'
      )}
    >
      <Link to='/'>
        <div
          className={cn(
            'absolute inset-0 animate-fadeIn',
            'backdrop-grayscale backdrop-opacity-80 backdrop-blur bg-black/50'
          )}
        />
      </Link>
      <div ref={questDetailsRef} className='flex justify-end max-w-md w-full'>
        <div className='animate-slideIn overflow-hidden'>
          <div
            style={{ width }}
            className={cn(
              'flex flex-col gap-5',
              'h-full bg-amber-100 text-amber-950 px-5 pb-5 pt-4 overflow-hidden'
            )}
          >
            <div className='flex flex-col gap-2'>
              {quest?.details ? (
                <>
                  <h2 className='font-cursive text-2xl flex justify-between py-1 sticky top-0 bg-amber-100 z-10 gap-5'>
                    <span className='font-bold flex-auto break-all'>
                      {quest.details.title}
                    </span>
                    <Link to='/'>
                      <X size={24} />
                    </Link>
                  </h2>
                  <h2 className='font-cursive opacity-80 font-bold'>
                    Reward: {quest.details.reward}
                  </h2>
                </>
              ) : (
                <>
                  <h2 className='h-8 w-64 bg-amber-950 animate-pulse rounded' />
                  <h2 className='h-6 w-56 bg-amber-950 animate-pulse rounded' />
                </>
              )}
            </div>
            {quest?.details ? (
              <div className='font-cursive'>{quest.details.description}</div>
            ) : (
              <div className='flex flex-col gap-2'>
                <div className='h-6 w-72 bg-amber-950 animate-pulse rounded' />
                <div className='h-6 w-64 bg-amber-950 animate-pulse rounded' />
              </div>
            )}
            <div className='border-b border-dashed border-amber-950' />
            {quest?.account && (
              <div className='flex flex-col gap-2'>
                <div>
                  <span>Author: </span>
                  {quest.account.owner.equals(wallet?.publicKey) ? (
                    <span className='font-bold'>
                      You are the owner of this quest
                    </span>
                  ) : (
                    <>
                      <br />
                      <span className='font-bold'>
                        {quest.account.owner.toBase58()}
                      </span>
                    </>
                  )}
                </div>
                <div>
                  <span>Staked: </span>
                  <span className='font-bold'>
                    {formatNumber(
                      quest.account.staked.toNumber() / 10 ** 9 + ''
                    )}
                  </span>
                </div>
                <div>
                  <span>Min Stake Required: </span>
                  <span className='font-bold'>
                    {formatNumber(
                      quest.account.minStakeRequired.toNumber() / 10 ** 9 + ''
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
