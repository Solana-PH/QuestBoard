import cn from 'classnames'
import { FC, ReactNode, useEffect, useRef } from 'react'
import { PageBackdrop } from './PageBackdrop'
import { useLocation } from 'react-router-dom'

export const PageScroller: FC<{ children: ReactNode }> = ({ children }) => {
  // todo: automatically scroll to the right when navigation changes
  const containerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.scrollTo({
      left: containerRef.current.scrollWidth,
      behavior: 'smooth',
    })
  }, [location])

  return (
    <div className={cn('absolute inset-0 w-full h-full')}>
      <PageBackdrop />
      <div
        ref={containerRef}
        className={cn(
          'flex h-full',
          'flex-row-reverse',
          'overflow-hidden md:overflow-x-scroll'
        )}
      >
        <div
          className={cn(
            'animate-slideIn',
            'md:px-2 md:pt-2 md:gap-2',
            'relative flex',
            'flex-none h-full'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

{
  /* <div className='flex justify-end absolute inset-0 pointer-events-none'></div> */
}
