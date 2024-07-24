import cn from 'classnames'
import { FC, ReactNode, useEffect, useRef, useState } from 'react'

export const PagePanel: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const listener = () => setWidth(rect.width)
      window.addEventListener('resize', listener)

      listener()

      return () => window.removeEventListener('resize', listener)
    }
  }, [setWidth])

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex justify-end w-full pointer-events-auto',
        className ?? 'max-w-md'
      )}
    >
      <div className='animate-slideIn overflow-hidden'>
        <div
          style={{ width }}
          className={cn(
            'flex flex-col',
            'border border-amber-300 shadow-2xl',
            'h-full bg-stone-200 text-amber-950 overflow-x-hidden overflow-y-auto'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
