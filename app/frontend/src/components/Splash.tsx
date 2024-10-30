import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { FC } from 'react'

export const Splash: FC = () => {
  const { connecting } = useWallet()
  const { setVisible } = useWalletModal()

  if (connecting) return null

  return (
    <div className='flex flex-col animate-fadeIn bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-800'>
      <div className='h-dvh w-full flex flex-col gap-10 items-center justify-center'>
        <div className='flex flex-col gap-5 items-center justify-center'>
          <img
            src='/QuestBoardLogo.svg'
            alt='QuestBoard'
            className='aspect-square object-contain w-32 xl:w-64'
          />
          <p className='font-cursive text-2xl'>Connecting needs with deeds</p>
        </div>
        <button onClick={() => setVisible(true)}>Connect</button>
      </div>
    </div>
  )
}
