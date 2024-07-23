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
import { searchAtom } from '../atoms/searchAtom'

export const QuestCard: FC<
  ProgramAccount<IdlAccounts<QuestBoard>['quest']>
> = ({ account, publicKey }) => {
  const id = account.id.toBase58()
  const hash = bs58.encode(account.detailsHash)
  const details = useAtomValue(questDetailsAtom(id + '_' + hash))
  const connectionStatus = useAtomValue(
    userConnectionStatusAtom(account.owner.toBase58())
  )
  const searchFilter = useAtomValue(searchAtom)

  if (!details) return null

  let search = searchFilter.toLowerCase()
  if (search.startsWith('reward')) {
    search = search.replace('reward', '').replace(':', '').trim()

    if (!details.reward.toLowerCase().includes(search)) {
      return null
    }
  } else if (!details.title.toLowerCase().includes(search)) {
    return null
  }

  return (
    <Link
      to={`/quest/${publicKey.toBase58()}`}
      className={cn(
        !connectionStatus && 'brightness-50 grayscale',
        'border border-amber-300',
        'col-span-12 portrait:md:col-span-6 landscape:md:col-span-4',
        'portrait:xl:col-span-4 landscape:xl:col-span-3',
        'bg-stone-200 text-amber-950 p-5 flex flex-col gap-5',
        'animate-fadeIn transition-all'
      )}
    >
      <div className='flex flex-col gap-2'>
        <h2 className='text-2xl font-cursive font-bold break-before-all'>
          {details.title}
        </h2>

        <h2 className='text-xs font-bold uppercase tracking-wider opacity-80'>
          Reward: {details.reward}
        </h2>
      </div>
      <div className='text-black break-all text-sm'>{details.description}</div>
      <div className='border-b border-dashed border-black/25 mt-auto' />
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
        <div className='grid grid-cols-2 gap-5'>
          <div className='flex items-center justify-between gap-2'>
            <span>Staked: </span>
            <span className='font-bold text-right'>
              {formatNumber(account.staked.toNumber() / 10 ** 9 + '')}
            </span>
          </div>
          <div className='flex items-center justify-between gap-2'>
            <span>Min Stake: </span>
            <span className='font-bold text-right'>
              {formatNumber(account.minStakeRequired.toNumber() / 10 ** 9 + '')}
            </span>
          </div>
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
