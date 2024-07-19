import { FC } from 'react'

export const Splash: FC = () => {
  return (
    <div className='flex flex-col'>
      <div className='h-screen w-full flex flex-col gap-10 items-center justify-center'>
        <div className='flex flex-col gap-5 items-center justify-center'>
          <img
            src='/QuestBoardLogo.svg'
            alt='QuestBoard'
            className='aspect-square object-contain w-64'
          />
          <p className='font-cursive text-2xl italic'>
            Connecting needs with deeds
          </p>
        </div>
        <button>Connect</button>
      </div>
    </div>
  )
}
