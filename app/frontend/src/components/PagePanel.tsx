import cn from 'classnames'
import { FC, ReactNode } from 'react'

export const PagePanel: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'animate-slideIn overflow-hidden',
        'flex justify-end w-full pointer-events-auto',
        className ?? 'max-w-md'
      )}
    >
      <div
        className={cn(
          'flex flex-col w-full',
          'border border-amber-300',
          'h-full bg-stone-200 text-amber-950 overflow-x-hidden overflow-y-auto'
        )}
      >
        {children}
      </div>
    </div>
  )
}
