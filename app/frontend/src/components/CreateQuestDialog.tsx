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
import { formatNumber, parseNumber } from '../utils/formatNumber'
import { Keypair } from '@solana/web3.js'
import { sign } from 'tweetnacl'

export const CreateQuestDialog: FC = () => {
  const [showDialog, setShowDialog] = useAtom(showDialogAtom)
  const solBalance = useAtomValue(solBalanceFormattedAtom)
  const daoBalance = useAtomValue(daoBalanceFormattedAtom)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [stake, setStake] = useState('')
  const [minStake, setMinStake] = useState('')
  const [placement, setPlacement] = useState('')

  const onPostQuest = async () => {
    // generate ID for the quest
    // get the PDA of the quest based on ID
    // reach out partykit to store title, description & reward
    // partykit will return hash of ID + title + description + reward
    const idKeypair = Keypair.generate()
    const id = idKeypair.publicKey.toBase58()

    const details = [id, title.trim(), description.trim(), reward.trim()].join(
      ''
    )
    const signature = sign.detached(Buffer.from(details), idKeypair.secretKey)

    const payload = {
      id,
      title,
      description,
      reward,
      signature: Buffer.from(signature).toString('hex'),
    }

    // await fetch(`http://192.168.1.32:1999/questinfo/${id}`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload),
    // })
    await fetch(`http://192.168.1.32:1999/parties/main/questinfo_${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  return (
    <Dialog
      show={showDialog === Dialogs.CREATE_QUEST}
      onClose={() => setShowDialog(Dialogs.NONE)}
    >
      <ScrollableContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onPostQuest()
          }}
          className={cn(
            'flex flex-col gap-5',
            'mx-auto max-w-md w-full bg-amber-100 text-amber-950 px-5 pb-5 pt-4'
          )}
        >
          <h2 className='font-cursive text-2xl flex items-center justify-between py-1 sticky top-0 bg-amber-100 z-10'>
            <span>Create a Quest</span>
            <button type='button' onClick={() => setShowDialog(Dialogs.NONE)}>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='reward'
              className='text-xs uppercase tracking-wider font-bold opacity-50'
            >
              Reward
            </label>
            <input
              type='text'
              id='reward'
              placeholder='A birthday cake and a hug.'
              className='w-full bg-black/10 px-3 py-2'
              value={reward}
              onChange={(e) => setReward(e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='stake'
              className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
            >
              <span className='opacity-50'>Stake (Optional)</span>
              <button
                type='button'
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
              max={parseNumber(daoBalance, 0)}
              value={stake}
              onChange={setStake}
              onBlur={(val) => {
                if (minStake !== '') {
                  const stakeNum = parseNumber(val, 0)
                  const minStakeNum = parseNumber(minStake, 0)
                  setMinStake(
                    formatNumber(Math.min(stakeNum, minStakeNum) + '')
                  )
                }
              }}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='minstake'
              className='text-xs uppercase tracking-wider font-bold opacity-50'
            >
              Minimum Stake Requirement (Optional)
            </label>
            <NumberInput
              type='text'
              id='minstake'
              placeholder='How much you require the taker to stake for this.'
              className='w-full bg-black/10 px-3 py-2'
              value={minStake}
              onChange={setMinStake}
              onBlur={(minStake) => {
                if (minStake !== '') {
                  const stakeNum = parseNumber(stake, 0)
                  const minStakeNum = parseNumber(minStake, 0)
                  setMinStake(
                    formatNumber(Math.min(stakeNum, minStakeNum) + '')
                  )
                }
              }}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='placement'
              className='text-xs uppercase tracking-wider font-bold opacity-50'
            >
              Placement Boost (Optional)
            </label>
            <NumberInput
              type='text'
              id='placement'
              placeholder='Boost visibility of your post.'
              className='w-full bg-black/10 px-3 py-2'
              value={placement}
              onChange={setPlacement}
            />
          </div>
          <div className='bg-black/50 text-white'>
            <button
              type='submit'
              className='w-full px-3 py-2 flex items-center justify-center gap-3 bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
            >
              <Note size={32} />
              <span>Post a Quest</span>
            </button>
          </div>
        </form>
      </ScrollableContent>
    </Dialog>
  )
}
