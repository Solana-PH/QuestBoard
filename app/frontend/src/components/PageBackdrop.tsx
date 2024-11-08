import cn from 'classnames'
import { FC } from 'react'
import { Link } from 'react-router-dom'

export const PageBackdrop: FC = () => {
  return (
    <Link to='/'>
      <div
        className={cn(
          'absolute inset-0 animate-fadeInNoDelay overflow-hidden pointer-events-auto',
          'bg-black/30'
        )}
      />
    </Link>
  )
}
