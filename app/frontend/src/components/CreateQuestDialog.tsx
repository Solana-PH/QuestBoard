import { useAtom, useAtomValue } from 'jotai'
import { FC, useState } from 'react'
import cn from 'classnames'
import { Note, X } from '@phosphor-icons/react'
import { Dialogs, showDialogAtom } from '../atoms/showDialogAtom'
import Dialog from './Dialog'
import { ScrollableContent } from './ScrollableContent'
import { solBalanceFormattedAtom } from '../atoms/solBalanceAtom'
import { daoBalanceFormattedAtom } from '../atoms/daoBalanceAtom'
import { NumberInput } from './NumberInput'

export const CreateQuestDialog: FC = () => {
  const [showDialog, setShowDialog] = useAtom(showDialogAtom)
  const solBalance = useAtomValue(solBalanceFormattedAtom)
  const daoBalance = useAtomValue(daoBalanceFormattedAtom)
  const [stake, setStake] = useState('')

  return (
    <Dialog
      show={showDialog === Dialogs.CREATE_QUEST}
      onClose={() => setShowDialog(Dialogs.NONE)}
    >
      <ScrollableContent>
        <div
          className={cn(
            'flex flex-col gap-5',
            'mx-auto max-w-md w-full bg-amber-100 text-amber-950 px-5 pb-5 pt-4'
          )}
        >
          <h2 className='font-cursive text-2xl flex items-center justify-between py-1 sticky top-0 bg-amber-100 z-10'>
            <span>Create a Quest</span>
            <button onClick={() => setShowDialog(Dialogs.NONE)}>
              <X size={24} />
            </button>
          </h2>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='title'
              className='text-xs uppercase tracking-wider font-bold opacity-50'
            >
              Title
            </label>
            <input
              autoFocus
              type='text'
              id='title'
              placeholder='LF> A friend to join me on my birthday :('
              className='w-full bg-black/10 px-3 py-2'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='description'
              className='text-xs uppercase tracking-wider font-bold opacity-50'
            >
              Description
            </label>
            <textarea
              id='description'
              placeholder='Provide a meaningful description of your expectations for this quest.'
              className='w-full bg-black/10 px-3 py-2'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='reward'
              className='text-xs uppercase tracking-wider font-bold opacity-50'
            >
              Reward (Optional)
            </label>
            <input
              type='text'
              id='reward'
              placeholder='A birthday cake and a hug.'
              className='w-full bg-black/10 px-3 py-2'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='stake'
              className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
            >
              <span className='opacity-50'>Stake (Optional)</span>
              <button
                onClick={() => setStake(daoBalance)}
                className='uppercase tabular-nums'
              >
                Max <span>{daoBalance}</span>
              </button>
            </label>
            <NumberInput
              id='stake'
              placeholder='How much are you willing to stake for this quest?'
              className='w-full bg-black/10 px-3 py-2'
              value={stake}
              onChange={setStake}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='minstake'
              className='text-xs uppercase tracking-wider font-bold opacity-50'
            >
              Minimum Stake Requirement (Optional)
            </label>
            <input
              type='text'
              id='minstake'
              placeholder='How much you require the taker to stake for this.'
              className='w-full bg-black/10 px-3 py-2'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='placement'
              className='text-xs uppercase tracking-wider font-bold opacity-50'
            >
              Placement Boost (Optional)
            </label>
            <input
              type='text'
              id='placement'
              placeholder='Boost visibility of your post.'
              className='w-full bg-black/10 px-3 py-2'
            />
          </div>
          <div className='bg-black/50 text-white'>
            <button className='w-full px-3 py-2 flex items-center justify-center gap-3 bg-amber-300/10 hover:bg-amber-300/30 transition-colors'>
              <Note size={32} />
              <span>Post a Quest</span>
            </button>
          </div>
        </div>
      </ScrollableContent>
    </Dialog>
  )
}
