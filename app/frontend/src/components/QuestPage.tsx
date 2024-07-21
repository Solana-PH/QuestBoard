import cn from 'classnames'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollableContent } from './ScrollableContent'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { HandPalm, Trash, X } from '@phosphor-icons/react'
import { useAtom, useAtomValue } from 'jotai'
import { questAtom } from '../atoms/questsAtom'
import { formatNumber } from '../utils/formatNumber'
import { useUserWallet } from '../atoms/userWalletAtom'
import { programAtom } from '../atoms/programAtom'
import { PublicKey, Transaction } from '@solana/web3.js'
import { userConnectionStatusAtom } from '../atoms/userConnectionStatusAtom'

export const QuestPage: FC = () => {
  const { questId } = useParams()
  const navigate = useNavigate()
  const wallet = useUserWallet()
  const program = useAtomValue(programAtom)
  const questDetailsRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const quest = useAtomValue(questAtom(questId))
  const [busy, setBusy] = useState(false)
  const [connectionStatus, checkConnection] = useAtom(
    userConnectionStatusAtom(quest?.account?.owner?.toBase58() ?? '')
  )
  const [proposal, setProposal] = useState('')

  useEffect(() => {
    if (questDetailsRef.current) {
      const rect = questDetailsRef.current.getBoundingClientRect()
      const listener = () => setWidth(rect.width)
      window.addEventListener('resize', listener)

      listener()

      return () => window.removeEventListener('resize', listener)
    }
  }, [setWidth])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const onClose = async () => {
    if (!program) return
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

  const owner =
    (wallet?.publicKey && quest?.account?.owner.equals(wallet.publicKey)) ??
    false

  return (
    <div
      className={cn(
        'absolute inset-0',
        'flex justify-end',
        'overflow-x-scroll portrait:overflow-x-hidden overflow-y-hidden',
        'gap-3 p-3 portrait:gap-0 portrait:p-0 lg:gap-5 lg:p-5 pl-0'
      )}
    >
      <Link to='/'>
        <div
          className={cn(
            'absolute inset-0 animate-fadeInNoDelay',
            'backdrop-grayscale backdrop-opacity-80 backdrop-blur bg-black/50'
          )}
        />
      </Link>
      <div ref={questDetailsRef} className='flex justify-end max-w-md w-full'>
        <div className='animate-slideIn overflow-hidden'>
          <div
            style={{ width }}
            className={cn(
              'flex flex-col',
              'h-full bg-amber-100 text-amber-950 overflow-x-hidden overflow-y-auto'
            )}
          >
            <div className='flex flex-col gap-5 flex-auto px-5 pb-5 pt-4'>
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
                <div className='font-cursive text-lg'>
                  {quest.details.description}
                </div>
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
                    <span>Quest Account: </span>
                    <br />
                    <span className='font-bold break-all'>{questId}</span>
                  </div>
                  <div>
                    <span>
                      <span>Author: </span>
                      {!owner && (
                        <span className='inline-flex items-center gap-1 font-bold'>
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
                      <span className='font-bold'>
                        You are the owner of this quest
                      </span>
                    ) : (
                      <>
                        <br />
                        <span className='font-bold break-all'>
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
                      className='text-xs uppercase tracking-wider font-bold opacity-50'
                    >
                      Make an Offer
                    </label>
                    <textarea
                      id='proposal'
                      placeholder='Provide an offer to the owner. Make it concise and convincing.'
                      className='w-full bg-black/10 px-3 py-2'
                      value={proposal}
                      onChange={(e) =>
                        setProposal(e.target.value.substring(0, 320))
                      }
                    />
                  </div>
                  <div className='bg-black/50 text-white'>
                    <button
                      disabled={busy || !connectionStatus}
                      onClick={onClose}
                      className={cn(
                        busy || !connectionStatus
                          ? 'opacity-50 pointer-events-none cursor-wait'
                          : 'cursor-pointer',
                        'w-full px-3 py-2 flex items-center justify-center gap-3',
                        'bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
                      )}
                    >
                      <HandPalm size={32} />
                      {connectionStatus ? (
                        <span>{busy ? 'Please Wait' : 'Accept Quest'}</span>
                      ) : (
                        <span>Owner is Offline</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
