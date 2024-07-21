import cn from 'classnames'
import React, { FC, forwardRef, ReactNode } from 'react'

interface ScrollableContentProps {
  children: ReactNode
  className?: string
}

export const ScrollableContent: FC<
  ScrollableContentProps & { forwardRef?: Ref<HTMLDivElement> }
> = forwardRef<HTMLDivElement, ScrollableContentProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
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
)
