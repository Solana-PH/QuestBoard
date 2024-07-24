import cn from 'classnames'
import { FC, Suspense, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  HandPalm,
  Handshake,
  PaperPlaneTilt,
  ThumbsUp,
  Trash,
  X,
} from '@phosphor-icons/react'
import { useAtomValue } from 'jotai'
import { questAtom } from '../atoms/questsAtom'
import { formatNumber, parseNumber } from '../utils/formatNumber'
import { useUserWallet } from '../atoms/userWalletAtom'
import { programAtom } from '../atoms/programAtom'
import { PublicKey, Transaction } from '@solana/web3.js'
import { userConnectionStatusAtom } from '../atoms/userConnectionStatusAtom'
import { PageBackdrop } from './PageBackdrop'
import { PagePanel } from './PagePanel'
import { PageScroller } from './PageScroller'
import { NumberInput } from './NumberInput'
import { daoBalanceAtom } from '../atoms/daoBalanceAtom'
import { sendNotification } from '../utils/sendNotification'

const QuestPageInner: FC = () => {
  const { questId } = useParams()
  const navigate = useNavigate()
  const wallet = useUserWallet()
  const program = useAtomValue(programAtom)

  const quest = useAtomValue(questAtom(questId ?? ''))
  const [busy, setBusy] = useState(false)
  const connectionStatus = useAtomValue(
    userConnectionStatusAtom(quest?.account?.owner?.toBase58() ?? '')
  )

  const stakedValue = quest ? quest.account.staked.toNumber() / 10 ** 9 : 0
  const minStakeValue = quest
    ? quest.account.minStakeRequired.toNumber() / 10 ** 9
    : 0
  const maxStakeValue = quest ? quest.account.staked.toNumber() / 10 ** 9 : 0
  const [proposal, setProposal] = useState('')
  const [minStake, setMinStake] = useState(formatNumber(minStakeValue + ''))
  const daoBalance = useAtomValue(daoBalanceAtom)
  const [notifySuccess, setNotifySuccess] = useState(false)

  const daoDiff = useMemo(
    () => (daoBalance ?? 0) / 10 ** 9 - parseNumber(minStake, 0),
    [daoBalance, minStake]
  )

  const onClose = async () => {
    if (!program?.provider.sendAndConfirm) return
    if (!questId) return

    setBusy(true)

    try {
      const questPda = new PublicKey(questId)

      const unpublishIx = await program.methods
        .unpublishQuest()
        .accounts({
          owner: program.provider.publicKey,
        })
        .accountsPartial({
          quest: questPda,
        })
        .instruction()

      const closeIx = await program.methods
        .closeQuest()
        .accounts({
          owner: program.provider.publicKey,
        })
        .accountsPartial({
          quest: questPda,
        })
        .instruction()

      const tx = new Transaction().add(unpublishIx, closeIx)

      const txSignature = await program.provider.sendAndConfirm(tx, [], {
        commitment: 'confirmed',
      })

      console.log('Transaction submitted:', txSignature)
      navigate('/')
    } catch (error) {
      console.error(error)
    }
    setBusy(false)
  }

  const onSendNotification = async () => {
    if (!wallet?.publicKey) return
    if (!quest) return

    setBusy(true)

    try {
      const notification = {
        quest: questId,
        content: proposal,
        minStake: parseNumber(minStake, 0),
      }

      const message = JSON.stringify(notification)

      await sendNotification(
        wallet.publicKey.toBase58(),
        quest.account.owner.toBase58(),
        message,
        'quest_proposal'
      )

      setNotifySuccess(true)
    } catch (e) {
      console.error(e)
    }
    setBusy(false)
  }

  const owner =
    (wallet?.publicKey && quest?.account?.owner.equals(wallet.publicKey)) ??
    false

  if (!quest?.details || !quest?.account) return null

  return (
    <>
      <div className='flex flex-col gap-5 flex-auto px-5 pb-5 pt-4'>
        <div className='flex flex-col gap-2'>
          <h2 className='font-cursive text-2xl flex justify-between py-1 sticky top-0 bg-stone-200 z-10 gap-5'>
            <span className='font-bold flex-auto break-before-all'>
              {quest.details.title}
            </span>
            <Link to='/'>
              <X size={24} />
            </Link>
          </h2>
          <p className='text-sm font-bold uppercase tracking-wider opacity-80'>
            Reward: {quest.details.reward}
          </p>
        </div>
        <div className='break-before-all text-black'>
          {quest.details.description}
        </div>
        <div className='border-b border-dashed border-black/25 mt-auto' />
        <div className='flex flex-col gap-2'>
          <span className='flex items-center gap-2'>
            <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
              Owner{' '}
            </span>
            {!owner && (
              <span className='text-xs uppercase tracking-wider inline-flex items-center gap-1 font-bold'>
                {connectionStatus ? (
                  <>
                    <span className='text-green-500'>Online</span>
                    <span
                      className={cn(
                        'rounded-full w-2 h-2 flex-none',
                        'bg-green-500'
                      )}
                    />
                  </>
                ) : (
                  <>
                    <span className='text-red-500'>Offline</span>
                    <span
                      className={cn(
                        'rounded-full w-2 h-2 flex-none',
                        'bg-red-500'
                      )}
                    />
                  </>
                )}
              </span>
            )}
          </span>
          {owner ? (
            <span className='font-bold text-sm'>
              You are the owner of this quest.
            </span>
          ) : (
            <a
              target='_blank'
              rel='noreferrer'
              href={`https://solana.fm/address/${quest.account.owner.toBase58()}/?cluster=devnet-alpha`}
              className='font-bold text-sm break-all'
            >
              {quest.account.owner.toBase58()}
            </a>
          )}
        </div>
        <div className='border-b border-dashed border-black/25' />
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
              Quest Account
            </span>
            <a
              target='_blank'
              rel='noreferrer'
              href={`https://solana.fm/address/${questId}/?cluster=devnet-alpha`}
              className='text-sm font-bold break-all'
            >
              {questId}
            </a>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            {stakedValue > 0 ? (
              <>
                <div className='flex flex-col gap-2'>
                  <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
                    Staked
                  </span>
                  <span className='font-bold text-sm'>
                    {formatNumber(stakedValue + '')}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className='flex flex-col gap-2 col-span-2 text-red-500'>
                  <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
                    Warning
                  </span>
                  <span className='font-bold text-sm'>
                    Owner did not stake any DAO Tokens. Proceed with caution.
                  </span>
                </div>
              </>
            )}
            {minStakeValue > 0 && (
              <div className='flex flex-col gap-2'>
                <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
                  Min Stake Required
                </span>
                <span className='font-bold text-sm'>
                  {formatNumber(minStakeValue + '')}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className='border-b border-dashed border-black/25' />
      </div>
      <div className='flex-none px-5 pb-5 gap-5 flex flex-col'>
        {owner ? (
          <div className='bg-black/50 text-white'>
            <button
              disabled={busy}
              onClick={onClose}
              className={cn(
                busy
                  ? 'opacity-50 pointer-events-none cursor-wait'
                  : 'cursor-pointer',
                'w-full px-3 py-2 flex items-center justify-center gap-3',
                'bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
              )}
            >
              <Trash size={32} />
              <span>{busy ? 'Please Wait' : 'Close Quest'}</span>
            </button>
          </div>
        ) : (
          <>
            <div className='flex flex-col gap-1'>
              <label
                htmlFor='proposal'
                className='text-xs uppercase tracking-wider font-bold opacity-75'
              >
                Make an Offer
              </label>
              <textarea
                id='proposal'
                placeholder='Provide an offer to the owner. Make it concise and convincing.'
                className='w-full bg-black/5 px-3 py-2'
                value={proposal}
                onChange={(e) => setProposal(e.target.value.substring(0, 320))}
              />
            </div>
            {(daoBalance ?? 0) > 0 && (
              <div className='flex flex-col gap-1'>
                <label
                  htmlFor='minstake'
                  className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
                >
                  <span className='opacity-75'>Stake</span>
                </label>
                <NumberInput
                  type='text'
                  id='minstake'
                  placeholder='Required stake amount for this Quest.'
                  className='w-full bg-black/5 px-3 py-2'
                  value={minStake}
                  min={minStakeValue}
                  max={maxStakeValue}
                  onChange={setMinStake}
                  onBlur={(minStake) => {
                    const minStakeNum = parseNumber(minStake, 0)
                    formatNumber(Math.max(minStakeValue, minStakeNum) + '')
                  }}
                />
              </div>
            )}
            {notifySuccess ? (
              <div>
                <button
                  disabled
                  className={cn(
                    'bg-amber-300/10',
                    'w-full px-3 py-2 flex items-center justify-center gap-3 cursor-not-allowed'
                  )}
                >
                  <ThumbsUp size={32} />
                  <span>Owner is notified</span>
                </button>
              </div>
            ) : (
              <>
                {daoDiff >= 0 ? (
                  <div className={cn('bg-black/50 text-white')}>
                    <button
                      disabled={busy}
                      onClick={onSendNotification}
                      className={cn(
                        busy
                          ? 'opacity-50 pointer-events-none cursor-wait'
                          : 'cursor-pointer',
                        'w-full px-3 py-2 flex items-center justify-center gap-3',
                        'bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
                      )}
                    >
                      {connectionStatus ? (
                        <>
                          <Handshake size={32} />
                          <span>{busy ? 'Please Wait' : 'Accept Quest'}</span>
                        </>
                      ) : (
                        <>
                          <PaperPlaneTilt size={32} />
                          <span>Notify Owner</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      disabled
                      className={cn(
                        'bg-amber-300/10',
                        'w-full px-3 py-2 flex items-center justify-center gap-3 cursor-not-allowed'
                      )}
                    >
                      <HandPalm size={32} />
                      <span>Insufficient DAO Tokens</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

export const QuestPage: FC = () => {
  return (
    <>
      <PageBackdrop />
      <PageScroller>
        <PagePanel>
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
            <QuestPageInner />
          </Suspense>
        </PagePanel>
      </PageScroller>
    </>
  )
}
