import cn from 'classnames'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollableContent } from './ScrollableContent'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Trash, X } from '@phosphor-icons/react'
import { useAtomValue } from 'jotai'
import { questAtom } from '../atoms/questsAtom'
import { formatNumber } from '../utils/formatNumber'
import { useUserWallet } from '../atoms/userWalletAtom'
import { programAtom } from '../atoms/programAtom'
import { PublicKey, Transaction } from '@solana/web3.js'

export const QuestPage: FC = () => {
  const { questId } = useParams()
  const navigate = useNavigate()
  const wallet = useUserWallet()
  const program = useAtomValue(programAtom)

  const questDetailsRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const quest = useAtomValue(questAtom(questId))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (questDetailsRef.current) {
      const rect = questDetailsRef.current.getBoundingClientRect()
      const listener = () => setWidth(rect.width)
      window.addEventListener('resize', listener)

      listener()

      return () => window.removeEventListener('resize', listener)
    }
  }, [setWidth])

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
        'overflow-x-scroll overflow-y-hidden',
        'gap-3 p-3 lg:gap-5 lg:p-5'
      )}
    >
      <Link to='/'>
        <div
          className={cn(
            'absolute inset-0 animate-fadeIn',
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
              'h-full bg-amber-100 text-amber-950 overflow-hidden'
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
                    <span>Author: </span>
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
            <div className='flex-none px-5 pb-5'>
              {owner && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
