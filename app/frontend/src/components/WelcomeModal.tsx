import { FC, useState } from 'react'
import { useUserWallet } from '../atoms/userWalletAtom'
import { useAtom } from 'jotai'
import { myDetailsAtom } from '../atoms/userDetailsAtom'
import Dialog from './Dialog'
import { ScrollableContent } from './ScrollableContent'
import cn from 'classnames'
import TimeInput from './TimeInput'
import { Keypair, PublicKey } from '@solana/web3.js'
import { DownloadSimple, Pen, X } from '@phosphor-icons/react'
import bs58 from 'bs58'
import { partykitAddress } from '../constants/partykitAddress'
import { getSessionKeypair } from '../utils/getSessionKeypair'

export const WelcomeModal: FC = () => {
  const wallet = useUserWallet()
  const [info, refreshInfo] = useAtom(myDetailsAtom)
  const [start, setStart] = useState('8.0.AM')
  const [end, setEnd] = useState('8.0.PM')
  const [busy, setBusy] = useState(false)
  const [oldKeypairStr, setOldKeypairStr] = useState('')
  const [importError, setImportError] = useState('')

  const onSubmit = async () => {
    if (!wallet?.publicKey || !wallet.signMessage) return
    setBusy(true)
    try {
      const walletAddress = wallet.publicKey.toBase58()
      const sessionKeypair =
        getSessionKeypair(walletAddress) ?? Keypair.generate()
      const message = `I agree with QuestBoard's terms and privacy policy. ${sessionKeypair.publicKey.toBase58()}`
      const signature = await wallet.signMessage(Buffer.from(message))

      const payload = {
        sessionAddress: sessionKeypair.publicKey.toBase58(),
        signature: bs58.encode(signature),
        // todo: this will overwrite the values from the previos session
        // if info === 'different', exclude these fields
        availableStart: start,
        availableEnd: end,
      }

      const response = await fetch(
        `${partykitAddress}/parties/main/userinfo_${walletAddress}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create user details')
      }

      refreshInfo()

      // store sessionKeypair
      window.localStorage.setItem(
        `session_keypair_${walletAddress}`,
        bs58.encode(sessionKeypair.secretKey)
      )
    } catch (err) {
      console.error(err)
    }
    setBusy(false)
  }

  const onImport = async () => {
    if (!wallet?.publicKey) return
    if (typeof info !== 'string') return

    const walletAddress = wallet.publicKey.toBase58()
    const old = bs58.decode(oldKeypairStr)

    if (old.length !== 64) {
      setImportError('Invalid keypair')
      return
    }

    let oldKeypair: Keypair
    try {
      oldKeypair = Keypair.fromSecretKey(old)
    } catch (err) {
      setImportError('Invalid keypair')
      return
    }

    setBusy(true)

    if (info.startsWith('different')) {
      const [, prevSessionAddress] = info.split('_')
      if (!oldKeypair.publicKey.equals(new PublicKey(prevSessionAddress))) {
        setBusy(false)
        setImportError('Public Key did not match')
        return
      }
    }

    // restore session keypair
    window.localStorage.setItem(
      `session_keypair_${walletAddress}`,
      bs58.encode(oldKeypair.secretKey)
    )

    refreshInfo()
  }

  return (
    <>
      <Dialog show={info === 'unregistered'}>
        <ScrollableContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (busy) return
              onSubmit()
            }}
            className={cn(
              'flex flex-col gap-5',
              'border border-amber-300',
              'mx-auto max-w-md w-full bg-stone-200 text-amber-950 px-5 pb-5 pt-4'
            )}
          >
            <h2 className='font-cursive text-2xl flex items-center justify-between py-1 sticky top-0 bg-stone-200 z-10'>
              <span className='font-bold'>Welcome to QuestBoard!</span>
              <button type='button' onClick={() => wallet?.disconnect()}>
                <X size={24} />
              </button>
            </h2>
            <p className='text-black'>
              Please provide your availability so that other users know when
              they can reach you.
            </p>

            <div className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
                Available From
              </span>
              <TimeInput value={start} onChange={setStart} />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
                To
              </span>
              <TimeInput value={end} onChange={setEnd} />
            </div>
            <div className='border-b border-dashed border-black/25' />
            <div className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
                Disclosure
              </span>
              <p className='text-sm text-black'>
                By submitting, you agree to our{' '}
                <span className='font-bold text-amber-950'>
                  terms and conditions
                </span>{' '}
                and{' '}
                <span className='font-bold text-amber-950'>privacy policy</span>
                . The team behind this dApp is not responsible for any loss of
                funds or damages caused by the use of this application.
              </p>
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
                <Pen size={32} />
                <span>{busy ? 'Please Wait' : 'Sign & Submit'}</span>
              </button>
            </div>
          </form>
        </ScrollableContent>
      </Dialog>
      <Dialog
        show={
          info === 'missing' ||
          (typeof info === 'string' && info.startsWith('different'))
        }
      >
        <ScrollableContent>
          <div
            className={cn(
              'flex flex-col gap-5',
              'border border-amber-300',
              'mx-auto max-w-md w-full bg-stone-200 text-amber-950 px-5 pb-5 pt-4'
            )}
          >
            <h2 className='font-cursive text-2xl flex items-center justify-between py-1 sticky top-0 bg-stone-200 z-10'>
              <span className='font-bold'>Welcome back!</span>
              <button type='button' onClick={() => wallet?.disconnect()}>
                <X size={24} />
              </button>
            </h2>
            <div className='flex flex-col gap-1 text-red-500'>
              <span className='text-xs uppercase tracking-wider font-bold opacity-75'>
                Warning
              </span>
              {info === 'missing' ? (
                <>
                  <p className='text-black'>
                    It seems like you have lost your old session for this wallet
                    or might be using a different device.
                  </p>
                  <p className='text-black'>
                    To retain your session and be able to decrypt your old
                    messages, it is recommended to recover your previous
                    keypair.
                  </p>
                </>
              ) : (
                <>
                  <p className='text-black'>
                    It seems like you are using a different session for this
                    wallet and might be on a different device.
                  </p>
                  <p className='text-black'>
                    Would you like to recover your keypair from the other
                    device?
                  </p>
                </>
              )}
            </div>
            <div className='flex flex-col gap-1'>
              <label
                htmlFor='keypair'
                className='text-xs uppercase tracking-wider font-bold flex justify-between'
              >
                <span className='opacity-75'>Keypair</span>
                {importError && (
                  <span className='text-red-500'>{importError}</span>
                )}
              </label>
              <input
                autoFocus
                type='password'
                id='keypair'
                placeholder='Paste your previous keypair here'
                className='w-full bg-black/5 px-3 py-2'
                value={oldKeypairStr}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setOldKeypairStr(e.target.value)}
              />
            </div>
            <div className='bg-black/50 text-white'>
              <button
                onClick={onImport}
                type='button'
                disabled={busy}
                className={cn(
                  busy
                    ? 'opacity-50 pointer-events-none cursor-wait'
                    : 'cursor-pointer',
                  'w-full px-3 py-2 flex items-center justify-center gap-3',
                  'bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
                )}
              >
                <DownloadSimple size={32} />
                <span>{busy ? 'Please Wait' : 'Import Session Keypair'}</span>
              </button>
            </div>
            <div className='text-center text-sm'>
              <button onClick={onSubmit} className='underline'>
                {info === 'missing'
                  ? 'Generate a new session instead'
                  : 'Skip and use the stored session in this device'}
              </button>
            </div>
          </div>
        </ScrollableContent>
      </Dialog>
    </>
  )
}
