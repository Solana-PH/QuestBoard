import { IdlAccounts, ProgramAccount } from '@coral-xyz/anchor'
import { FC } from 'react'
import { QuestBoard } from '../types/quest_board'
import bs58 from 'bs58'
import { useAtomValue } from 'jotai'
import { questDetailsAtom } from '../atoms/questDetailsAtom'
import { formatNumber } from '../utils/formatNumber'
import cn from 'classnames'
import { Link } from 'react-router-dom'
import { userConnectionStatusAtom } from '../atoms/userConnectionStatusAtom'
import { trimAddress } from '../utils/trimAddress'

export const QuestCard: FC<
  ProgramAccount<IdlAccounts<QuestBoard>['quest']>
> = ({ account, publicKey }) => {
  const id = account.id.toBase58()
  const hash = bs58.encode(account.detailsHash)
  const details = useAtomValue(questDetailsAtom(id + '_' + hash))
  const connectionStatus = useAtomValue(
    userConnectionStatusAtom(account.owner.toBase58())
  )

  return (
    <Link
      to={`/quest/${publicKey.toBase58()}`}
      className={cn(
        !connectionStatus && 'brightness-75 grayscale',
        'col-span-12 portrait:md:col-span-6 landscape:md:col-span-4',
        'portrait:xl:col-span-4 landscape:xl:col-span-3',
        'bg-amber-100 text-amber-950 p-5 flex flex-col gap-5',
        'animate-fadeIn transition-all'
      )}
    >
      <div className='flex flex-col gap-2'>
        {details ? (
          <h2 className='text-2xl font-cursive font-bold'>{details.title}</h2>
        ) : (
          <h2 className='h-8 w-64 bg-amber-950 animate-pulse rounded' />
        )}
        {details ? (
          <h2 className='font-cursive opacity-80 font-bold'>
            Reward: {details.reward}
          </h2>
        ) : (
          <h2 className='h-6 w-56 bg-amber-950 animate-pulse rounded' />
        )}
      </div>
      {details ? (
        <div className='font-cursive'>{details.description}</div>
      ) : (
        <div className='flex flex-col gap-2'>
          <div className='h-6 w-72 bg-amber-950 animate-pulse rounded' />
          <div className='h-6 w-64 bg-amber-950 animate-pulse rounded' />
        </div>
      )}
      <div className='border-b border-dashed border-amber-950 mt-auto' />
      <div className='flex flex-col gap-2 text-xs'>
        <div className='flex items-center gap-2'>
          <span>Author: </span>
          <span className='font-bold flex items-center gap-2'>
            <span>{trimAddress(account.owner.toBase58())}</span>
            {connectionStatus && (
              <span
                className={cn('rounded-full w-2 h-2 flex-none', 'bg-green-500')}
              />
            )}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span>Staked: </span>
          <span className='font-bold'>
            {formatNumber(account.staked.toNumber() / 10 ** 9 + '')}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span>Min Stake Required: </span>
          <span className='font-bold'>
            {formatNumber(account.minStakeRequired.toNumber() / 10 ** 9 + '')}
          </span>
        </div>
        {/* <div className='flex items-center gap-2'>
          <span>Placement Paid: </span>
          <span className='font-bold'>
            {formatNumber(account.placementPaid.toNumber() / 10 ** 9 + '')}
          </span>
        </div> */}
      </div>
    </Link>
  )
}
