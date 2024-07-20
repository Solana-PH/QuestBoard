import cn from 'classnames'
import React, { FC, ReactNode } from 'react'

export const ScrollableContent: FC<{
  children: ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex-auto w-full h-full relative',
        'overflow-x-hidden overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  )
}
