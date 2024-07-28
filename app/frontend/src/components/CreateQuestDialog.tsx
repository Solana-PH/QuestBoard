import { useAtom, useAtomValue } from 'jotai'
import { FC, useMemo, useState } from 'react'
import cn from 'classnames'
import { HandPalm, Note, X } from '@phosphor-icons/react'
import { Dialogs, showDialogAtom } from '../atoms/showDialogAtom'
import Dialog from './Dialog'
import { ScrollableContent } from './ScrollableContent'
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
import { solBalanceAtom } from '../atoms/solBalanceAtom'
import { configAtom } from '../atoms/configAtom'

export const CreateQuestDialog: FC = () => {
  const [showDialog, setShowDialog] = useAtom(showDialogAtom)
  const daoBalance = useAtomValue(daoBalanceFormattedAtom)
  const solBalance = useAtomValue(solBalanceAtom)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [stake, setStake] = useState('')
  const [minStake, setMinStake] = useState('')
  const [placement, setPlacement] = useState('')
  const program = useAtomValue(programAtom)
  const [busy, setBusy] = useState(false)
  const config = useAtomValue(configAtom)

  const cost = useMemo(() => {
    if (!config) return 1
    const baseFee = config.baseFee.toNumber()
    const minSol = 0.0047 * LAMPORTS_PER_SOL + baseFee
    const placementFee = parseNumber(placement, 0) * LAMPORTS_PER_SOL
    const totalCost = minSol + placementFee
    return ((solBalance ?? 0) - totalCost) / LAMPORTS_PER_SOL
  }, [config, placement, solBalance])

  const onPostQuest = async () => {
    if (!program?.provider?.sendAndConfirm) return
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

      // check notification settings
      if (Notification.permission === 'default') {
        setShowDialog(Dialogs.ENABLE_NOTIF)
      } else {
        setShowDialog(Dialogs.NONE)
      }

      // clear all fields
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
            'border border-amber-300',
            'mx-auto max-w-md w-full bg-stone-200 text-amber-950 px-5 pb-5 pt-4'
          )}
        >
          <h2 className='font-cursive text-2xl flex items-center justify-between py-1 sticky top-0 bg-stone-200 z-10'>
            <span className='font-bold'>Create a Quest</span>
            <button type='button' onClick={() => setShowDialog(Dialogs.NONE)}>
              <X size={24} />
            </button>
          </h2>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='title'
              className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
            >
              <span className='opacity-75'>Title</span>
              {title.length > 60 && (
                <span className={cn(title.length === 120 && 'text-red-500')}>
                  {title.length}/120
                </span>
              )}
            </label>
            <input
              autoFocus
              type='text'
              id='title'
              placeholder='LF> A friend to join me on my birthday :('
              className='w-full bg-black/5 px-3 py-2'
              value={title}
              onChange={(e) => setTitle(e.target.value.substring(0, 120))}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='description'
              className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
            >
              <span className='opacity-75'>Description</span>
              {description.length > 320 && (
                <span
                  className={cn(description.length === 640 && 'text-red-500')}
                >
                  {description.length}/640
                </span>
              )}
            </label>
            <textarea
              id='description'
              placeholder='Provide a meaningful description of your expectations for this quest.'
              className='w-full bg-black/5 px-3 py-2'
              value={description}
              onChange={(e) => setDescription(e.target.value.substring(0, 640))}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='reward'
              className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
            >
              <span className='opacity-75'>Reward</span>
              {reward.length > 60 && (
                <span className={cn(reward.length === 120 && 'text-red-500')}>
                  {reward.length}/120
                </span>
              )}
            </label>
            <input
              type='text'
              id='reward'
              placeholder='A birthday cake and a hug.'
              className='w-full bg-black/5 px-3 py-2'
              value={reward}
              onChange={(e) => setReward(e.target.value.substring(0, 120))}
            />
          </div>
          {parseNumber(daoBalance ?? '', 0) > 0 && (
            <>
              <div className='flex flex-col gap-1'>
                <label
                  htmlFor='stake'
                  className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
                >
                  <span className='opacity-75'>Stake (Optional)</span>
                  {daoBalance && (
                    <button
                      type='button'
                      onClick={() => setStake(daoBalance)}
                      className='uppercase tabular-nums underline'
                    >
                      Max <span>{daoBalance}</span>
                    </button>
                  )}
                </label>
                <NumberInput
                  id='stake'
                  placeholder='How much are you willing to stake for this quest?'
                  className='w-full bg-black/5 px-3 py-2'
                  max={parseNumber(daoBalance ?? '', 0)}
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
                  className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
                >
                  <span className='opacity-75'>
                    Minimum Stake Requirement (Optional)
                  </span>
                  {parseNumber(stake, 0) > 0 && (
                    <button
                      type='button'
                      onClick={() => setMinStake(stake)}
                      className='uppercase tabular-nums underline'
                    >
                      Max
                    </button>
                  )}
                </label>
                <NumberInput
                  type='text'
                  id='minstake'
                  placeholder='How much you require the taker to stake for this.'
                  className='w-full bg-black/5 px-3 py-2'
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
            </>
          )}
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='placement'
              className='text-xs uppercase tracking-wider font-bold opacity-75'
            >
              Placement Boost (Optional, in SOL)
            </label>
            <NumberInput
              type='text'
              id='placement'
              placeholder='Boost visibility of your post.'
              className='w-full bg-black/5 px-3 py-2'
              value={placement}
              onChange={setPlacement}
            />
          </div>
          {cost > 0 ? (
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
          ) : (
            <div>
              <button
                type='button'
                disabled={true}
                className={cn(
                  'pointer-events-none',
                  'w-full px-3 py-2 flex items-center justify-center gap-3',
                  'bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
                )}
              >
                <span className='opacity-50'>
                  <HandPalm size={32} />
                </span>
                <span className='opacity-50'>Insufficient Balance</span>
                <span className='font-bold text-red-500'>
                  (
                  {Math.max(cost, -9999).toLocaleString('en-US', {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4,
                  })}{' '}
                  SOL)
                </span>
              </button>
            </div>
          )}
        </form>
      </ScrollableContent>
    </Dialog>
  )
}
