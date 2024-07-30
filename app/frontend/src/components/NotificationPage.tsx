import { FC, Suspense } from 'react'
import { PagePanel } from './PagePanel'
import { Link } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { notificationsAtom } from '../atoms/notificationsAtom'
import { useAtomValue } from 'jotai'
import { NotificationCard } from './NotificationCard'

const NotificationPageInner: FC = () => {
  const notifications = useAtomValue(notificationsAtom)
  return (
    <div className='flex flex-col gap-5 flex-auto px-5 pb-5 pt-4'>
      <div className='flex flex-col gap-2'>
        <h2 className='font-cursive text-2xl flex justify-between py-1 sticky top-0 bg-stone-200 z-10 gap-5'>
          <span className='font-bold flex-auto break-words'>Notifications</span>
          <Link to='/'>
            <X size={24} />
          </Link>
        </h2>
      </div>
      <div className='flex flex-col flex-auto relative'>
        <div className='show-next-when-empty flex flex-col'>
          {notifications.map((notif) => (
            <Suspense key={notif.id} fallback={null}>
              <NotificationCard notification={notif} />
            </Suspense>
          ))}
        </div>
        <div className='flex flex-col flex-auto items-center justify-center'>
          <p className='text-black'>You all caught up!</p>
        </div>
      </div>
    </div>
  )
}

export const NotificationPage: FC = () => {
  return (
    <>
      <PagePanel>
        <Suspense
          fallback={
            <div className='flex flex-col gap-5 flex-auto p-5'>
              <div className='flex flex-col gap-2'>
                <h2 className='h-10 w-64 bg-amber-950/50 animate-pulse rounded' />
                <h2 className='h-5 w-56 bg-amber-950/50 animate-pulse rounded' />
              </div>
              <div className='flex flex-col gap-2'>
                <div className='h-6 w-72 bg-amber-950/50 animate-pulse rounded' />
                <div className='h-6 w-64 bg-amber-950/50 animate-pulse rounded' />
              </div>
              <div className='flex flex-col gap-2'>
                <div className='h-6 w-36 bg-amber-950/50 animate-pulse rounded' />
                <div className='h-6 w-64 bg-amber-950/50 animate-pulse rounded' />
              </div>
            </div>
          }
        >
          <NotificationPageInner />
        </Suspense>
      </PagePanel>
    </>
  )
}
