import cn from 'classnames'
import { FC, Suspense, useEffect, useMemo, useState } from 'react'
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
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
import { PagePanel } from './PagePanel'
import { NumberInput } from './NumberInput'
import { daoBalanceAtom } from '../atoms/daoBalanceAtom'
import { sendNotification } from '../utils/sendNotification'
import { NotificationMessageType } from '../atoms/notificationsAtom'
import { idbAtom } from '../atoms/idbAtom'
import bs58 from 'bs58'

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
  const location = useLocation()
  const idb = useAtomValue(idbAtom)

  const daoDiff = useMemo(
    () => (daoBalance ?? 0) / 10 ** 9 - parseNumber(minStake, 0),
    [daoBalance, minStake]
  )

  useEffect(() => {
    if (!quest) return
    if (!wallet?.publicKey) return

    if (
      !window.location.pathname.includes('/chat') &&
      quest.account.status === 3
    ) {
      if (
        quest.account.owner.equals(wallet.publicKey) ||
        quest.account.offeree?.equals(wallet.publicKey)
      ) {
        navigate('chat')
      }
    }
  }, [quest, navigate])

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
    if (!idb) return
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

      const proposalHash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest('SHA-256', Buffer.from(message, 'utf-8'))
        )
      )

      await idb.put('proposal_hash', message, bs58.encode(proposalHash))

      await sendNotification(
        wallet.publicKey.toBase58(),
        quest.account.owner.toBase58(),
        message,
        NotificationMessageType.QUEST_PROPOSAL
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
        <div className='flex flex-col gap-3'>
          <h2 className='font-cursive text-2xl flex justify-between py-1 sticky top-0 bg-gray-800 z-10 gap-5'>
            <span className='font-bold flex-auto break-words'>
              {quest.details.title}
            </span>
            {!location.pathname.includes('chat') && (
              <Link to='/'>
                <X size={24} />
              </Link>
            )}
          </h2>
          <p className='text-sm font-bold uppercase tracking-wider opacity-80 text-yellow-100'>
            Reward: {quest.details.reward}
          </p>
        </div>
        <div className='break-words '>{quest.details.description}</div>
        <div className='border-b border-dashed border-white/25 mt-auto' />
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
              You are the owner of this Quest.
            </span>
          ) : (
            <a
              target='_blank'
              rel='noreferrer'
              href={`https://solana.fm/address/${quest.account.owner.toBase58()}/?cluster=devnet-alpha`}
              className='font-bold text-sm break-words'
            >
              {quest.account.owner.toBase58()}
            </a>
          )}
        </div>
        <div className='border-b border-dashed border-white/25' />
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
              Quest Account
            </span>
            <a
              target='_blank'
              rel='noreferrer'
              href={`https://solana.fm/address/${questId}/?cluster=devnet-alpha`}
              className='text-sm font-bold break-words'
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
                {owner ? (
                  <div className='flex flex-col gap-2 col-span-2 text-red-500'>
                    <span className='font-bold text-sm'>
                      You did not staked any DAO tokens for this Quest.
                    </span>
                  </div>
                ) : (
                  <div className='flex flex-col gap-2 col-span-2 text-red-500'>
                    <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
                      Warning
                    </span>
                    <span className='font-bold text-sm'>
                      Owner did not stake any DAO Tokens. Proceed with caution.
                    </span>
                  </div>
                )}
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
        <div className='border-b border-dashed border-white/25' />
      </div>
      {quest.account.status === 1 && (
        <div className='flex-none px-5 pb-5 gap-5 flex flex-col'>
          {owner ? (
            <div className=''>
              <button
                disabled={busy}
                onClick={onClose}
                className={cn(
                  busy
                    ? 'opacity-50 pointer-events-none cursor-wait'
                    : 'cursor-pointer',
                  'w-full px-3 py-2 flex items-center justify-center gap-3',
                  'bg-gray-300/10 hover:bg-gray-300/30 transition-colors'
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
                  className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
                >
                  <span className='opacity-75'>Make an Offer</span>
                  {proposal.length > 210 && (
                    <span
                      className={cn(proposal.length === 320 && 'text-red-500')}
                    >
                      {proposal.length}/320
                    </span>
                  )}
                </label>
                <textarea
                  id='proposal'
                  placeholder='Provide an offer to the owner. Make it concise and convincing.'
                  className='w-full bg-black/5 px-3 py-2'
                  value={proposal}
                  onChange={(e) =>
                    setProposal(e.target.value.substring(0, 320))
                  }
                />
              </div>
              {(daoBalance ?? 0) > 0 && stakedValue > 0 && (
                <div className='flex flex-col gap-1'>
                  <label
                    htmlFor='minstake'
                    className='text-xs uppercase tracking-wider font-bold flex items-center justify-between'
                  >
                    <span className='opacity-75'>Stake</span>
                  </label>
                  <NumberInput
                    disabled={stakedValue === minStakeValue}
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
                      'bg-gray-300/10',
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
                    <div className={cn('')}>
                      <button
                        disabled={busy}
                        onClick={onSendNotification}
                        className={cn(
                          busy
                            ? 'opacity-50 pointer-events-none cursor-wait'
                            : 'cursor-pointer',
                          'w-full px-3 py-2 flex items-center justify-center gap-3',
                          'bg-gray-300/10 hover:bg-gray-300/30 transition-colors'
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
                          'bg-gray-300/10',
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
      )}
    </>
  )
}

export const QuestPage: FC = () => {
  return (
    <>
      <PagePanel>
        <Suspense
          fallback={
            <div className='flex flex-col gap-5 flex-auto p-5'>
              <div className='flex flex-col gap-2'>
                <h2 className='h-10 w-64 bg-gray-600/50 animate-pulse rounded' />
                <h2 className='h-5 w-56 bg-gray-600/50 animate-pulse rounded' />
              </div>
              <div className='flex flex-col gap-2'>
                <div className='h-6 w-72 bg-gray-600/50 animate-pulse rounded' />
                <div className='h-6 w-64 bg-gray-600/50 animate-pulse rounded' />
              </div>
              <div className='flex flex-col gap-2'>
                <div className='h-6 w-36 bg-gray-600/50 animate-pulse rounded' />
                <div className='h-6 w-64 bg-gray-600/50 animate-pulse rounded' />
              </div>
            </div>
          }
        >
          <QuestPageInner />
        </Suspense>
      </PagePanel>

      <Outlet />
    </>
  )
}
