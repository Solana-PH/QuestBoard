import cn from 'classnames'
import { FC, ReactNode } from 'react'

export const PageScroller: FC<{ children: ReactNode }> = ({ children }) => {
  // todo: automatically scroll to the right when navigation changes
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none',
        'flex justify-end',
        'overflow-x-scroll portrait:overflow-x-hidden md:overflow-x-hidden overflow-y-hidden',
        'gap-0 p-0 md:gap-3 md:p-3 lg:gap-5 lg:p-5 pl-0'
      )}
    >
      {children}
    </div>
  )
}
