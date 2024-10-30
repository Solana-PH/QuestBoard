import { useAtomValue } from 'jotai'
import { FC, Suspense } from 'react'
import { sortedQuestsAtom } from '../atoms/questsAtom'
import { QuestCard } from './QuestCard'
import cn from 'classnames'

export const QuestsList: FC = () => {
  const list = useAtomValue(sortedQuestsAtom)

  return (
    <>
      {list.map((quest) => {
        const id = quest.publicKey.toBase58()
        return (
          <Suspense
            key={id}
            fallback={
              <div
                className={cn(
                  'brightness-50 grayscale overflow-hidden',
                  'border border-amber-300',
                  'break-inside-avoid',
                  'bg-stone-200 text-amber-950 p-5 flex flex-col gap-5',
                  'animate-fadeIn transition-all'
                )}
              >
                <div className='flex flex-col gap-2'>
                  <h2 className='h-8 w-64 bg-amber-950 animate-pulse rounded' />
                  <h2 className='h-4 w-56 bg-amber-950 animate-pulse rounded' />
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='h-5 w-72 bg-amber-950 animate-pulse rounded' />
                </div>
                <div className='border-b border-dashed border-black/25 mt-auto' />
                <div className='flex flex-col gap-2 text-xs'>
                  <div className='h-4 w-44 bg-amber-950 animate-pulse rounded' />
                  <div className='h-4 w-9 bg-amber-950 animate-pulse rounded' />
                </div>
              </div>
            }
          >
            <QuestCard {...quest} />
          </Suspense>
        )
      })}
    </>
  )
}
