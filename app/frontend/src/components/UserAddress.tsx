import { FC } from 'react'
import { userConnectionStatusAtom } from '../atoms/userConnectionStatusAtom'
import { useAtomValue } from 'jotai'
import { trimAddress } from '../utils/trimAddress'
import cn from 'classnames'

export const UserAddress: FC<{ address: string; trim?: boolean }> = ({
  address,
  trim,
}) => {
  const connectionStatus = useAtomValue(userConnectionStatusAtom(address))

  return (
    <span className='flex items-center gap-2'>
      <span>{trim ? trimAddress(address) : address}</span>
      {connectionStatus && (
        <span
          className={cn('rounded-full w-2 h-2 flex-none', 'bg-green-500')}
        />
      )}
    </span>
  )
}
