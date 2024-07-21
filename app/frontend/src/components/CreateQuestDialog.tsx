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
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from '@solana/web3.js'
import { sign } from 'tweetnacl'
import bs58 from 'bs58'
import { PROGRAM_ID, programAtom } from '../atoms/programAtom'
import { BN } from '@coral-xyz/anchor'
import { partykitAddress } from '../constants/partykitAddress'

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
  const program = useAtomValue(programAtom)
  const [busy, setBusy] = useState(false)

  const onPostQuest = async () => {
    if (!program) return
    const titleTrimmed = title.trim()
    const descriptionTrimmed = description.trim()
    const rewardTrimmed = reward.trim()

    if (titleTrimmed === '' || titleTrimmed.length > 120) return
    if (descriptionTrimmed === '' || descriptionTrimmed.length > 320) return
    if (rewardTrimmed === '' || rewardTrimmed.length > 120) return

    setBusy(true)
    try {
      const idKeypair = Keypair.generate()
      const id = idKeypair.publicKey.toBase58()

      const details = [
        id,
        titleTrimmed,
        descriptionTrimmed,
        rewardTrimmed,
      ].join('')
      const signature = sign.detached(Buffer.from(details), idKeypair.secretKey)

      const payload = {
        id,
        title: titleTrimmed,
        description: descriptionTrimmed,
        reward: rewardTrimmed,
        signature: bs58.encode(signature),
      }

      const response = await fetch(
        `${partykitAddress}/parties/main/questinfo_${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create quest details')
      }

      const hashStr = await response.text()
      const hash = bs58.decode(hashStr)

      const [questPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('quest'), idKeypair.publicKey.toBytes()],
        PROGRAM_ID
      )

      const createIx = await program.methods
        .createQuest({
          detailsHash: Array.from(hash),
          minStakeRequired: new BN(parseNumber(minStake, 0) * 10 ** 9),
          placementPaid: new BN(parseNumber(placement, 0) * LAMPORTS_PER_SOL),
          stakeAmount: new BN(parseNumber(stake, 0) * 10 ** 9),
        })
        .accounts({
          owner: program.provider.publicKey,
          id: idKeypair.publicKey,
        })
        .signers([idKeypair])
        .instruction()

      const publishIx = await program.methods
        .publishQuest()
        .accounts({
          owner: program.provider.publicKey,
        })
        .accountsPartial({
          quest: questPda,
        })
        .instruction()

      const tx = new Transaction().add(createIx, publishIx)

      const txSignature = await program.provider.sendAndConfirm(
        tx,
        [idKeypair],
        {
          commitment: 'confirmed',
        }
      )

      console.log('Transaction submitted:', txSignature)

      // clear all fields
      setShowDialog(Dialogs.NONE)
      setTitle('')
      setDescription('')
      setReward('')
      setStake('')
      setMinStake('')
      setPlacement('')

      setBusy(false)
    } catch (error) {
      setBusy(false)
      throw error
    }
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
            if (busy) return
            onPostQuest()
          }}
          className={cn(
            'flex flex-col gap-5',
            'mx-auto max-w-md w-full bg-amber-100 text-amber-950 px-5 pb-5 pt-4'
          )}
        >
          <h2 className='font-cursive text-2xl flex items-center justify-between py-1 sticky top-0 bg-amber-100 z-10'>
            <span className='font-bold'>Create a Quest</span>
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
              onChange={(e) => setTitle(e.target.value.substring(0, 120))}
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
              onChange={(e) => setDescription(e.target.value.substring(0, 320))}
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
              onChange={(e) => setReward(e.target.value.substring(0, 120))}
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
              disabled={busy}
              className={cn(
                busy
                  ? 'opacity-50 pointer-events-none cursor-wait'
                  : 'cursor-pointer',
                'w-full px-3 py-2 flex items-center justify-center gap-3',
                'bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
              )}
            >
              <Note size={32} />
              <span>{busy ? 'Please Wait' : 'Post a Quest'}</span>
            </button>
          </div>
        </form>
      </ScrollableContent>
    </Dialog>
  )
}
