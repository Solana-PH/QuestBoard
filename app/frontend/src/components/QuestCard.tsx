import { IdlAccounts, ProgramAccount } from '@coral-xyz/anchor'
import { FC } from 'react'
import { QuestBoard } from '../../../../target/types/quest_board'
import bs58 from 'bs58'
import { useAtomValue } from 'jotai'
import { questDetailsAtom } from '../atoms/questDetailsAtom'
import { trimAddress } from '../utils/trimAddress'
import { formatNumber } from '../utils/formatNumber'
import cn from 'classnames'

export const QuestCard: FC<
  ProgramAccount<IdlAccounts<QuestBoard>['quest']>
> = ({ account, publicKey }) => {
  const id = account.id.toBase58()
  const hash = bs58.encode(account.detailsHash)
  const details = useAtomValue(questDetailsAtom(id + '_' + hash))

  return (
    <div
      className={cn(
        'col-span-12 portrait:md:col-span-6 landscape:md:col-span-4',
        'portrait:xl:col-span-4 landscape:xl:col-span-3',
        'bg-amber-100 text-amber-950 p-5 flex flex-col gap-5'
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
      <div className='border-b border-dashed border-amber-950' />
      <div className='flex flex-col gap-2 text-xs'>
        <div>
          <span>Author: </span>
          <span className='font-bold'>
            {trimAddress(account.owner.toBase58())} (Offline)
          </span>
        </div>
        <div>
          <span>Staked: </span>
          <span className='font-bold'>
            {formatNumber(account.staked.toNumber() / 10 ** 9 + '')}
          </span>
        </div>
        <div>
          <span>Min Stake Required: </span>
          <span className='font-bold'>
            {formatNumber(account.minStakeRequired.toNumber() / 10 ** 9 + '')}
          </span>
        </div>
      </div>
    </div>
  )
}
