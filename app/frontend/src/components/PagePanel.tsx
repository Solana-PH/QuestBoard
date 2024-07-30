import cn from 'classnames'
import { FC, ReactNode } from 'react'

export const PagePanel: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'overflow-hidden flex-none',
        'flex justify-end pointer-events-auto'
      )}
    >
      <div
        className={cn(
          className ?? 'md:w-[28rem]',
          'flex flex-col w-screen ',
          'border border-amber-300',
          'h-full bg-stone-200 text-amber-950 overflow-x-hidden overflow-y-auto'
        )}
      >
        {children}
      </div>
    </div>
  )
}
