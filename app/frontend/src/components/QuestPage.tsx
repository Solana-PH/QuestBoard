import cn from 'classnames'
import { FC, useEffect, useRef, useState } from 'react'
import { ScrollableContent } from './ScrollableContent'
import { Link, useParams } from 'react-router-dom'
import { X } from '@phosphor-icons/react'

export const QuestPage: FC = () => {
  const { questId } = useParams()

  const scrollableRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (scrollableRef.current) {
      const rect = scrollableRef.current.getBoundingClientRect()
      const listener = () => setWidth(rect.width)
      window.addEventListener('resize', listener)

      listener()

      return () => window.removeEventListener('resize', listener)
    }
  }, [setWidth])

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
            'absolute inset-0',
            'backdrop-grayscale backdrop-opacity-80 backdrop-blur bg-black/50'
          )}
        />
      </Link>
      <ScrollableContent
        ref={scrollableRef}
        className='flex justify-end max-w-md'
      >
        <div className='animate-slideIn overflow-hidden'>
          <div
            style={{ width }}
            className='h-full bg-amber-100 text-amber-950 px-5 pb-5 pt-4 overflow-hidden'
          >
            <h2 className='font-cursive text-2xl flex justify-between py-1 sticky top-0 bg-amber-100 z-10 gap-5'>
              <span className='font-bold flex-auto break-all'>{questId}</span>
              <Link to='/'>
                <X size={24} />
              </Link>
            </h2>
          </div>
        </div>
      </ScrollableContent>
    </div>
  )
}
