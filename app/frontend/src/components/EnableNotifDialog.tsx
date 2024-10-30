import { FC } from 'react'
import Dialog from './Dialog'
import { ScrollableContent } from './ScrollableContent'
import cn from 'classnames'
import { Dialogs, showDialogAtom } from '../atoms/showDialogAtom'
import { useAtom } from 'jotai'
import { X } from '@phosphor-icons/react'

export const EnableNotifDialog: FC = () => {
  const [showDialog, setShowDialog] = useAtom(showDialogAtom)

  const onEnable = async () => {
    await Notification.requestPermission()
    setShowDialog(Dialogs.NONE)
  }

  return (
    <Dialog
      show={showDialog === Dialogs.ENABLE_NOTIF}
      onClose={() => setShowDialog(Dialogs.NONE)}
    >
      <ScrollableContent>
        <div
          className={cn(
            'flex flex-col gap-5',
            'rounded',
            'mx-auto max-w-md w-full bg-gray-800  px-5 pb-5 pt-4'
          )}
        >
          <h2 className='font-cursive text-2xl flex items-center justify-between py-1 sticky top-0 bg-gray-800 z-10'>
            <span className='font-bold'>Enable Notification</span>
            <button type='button' onClick={() => setShowDialog(Dialogs.NONE)}>
              <X size={24} />
            </button>
          </h2>
          <p className=''>
            To get notified if someone picks your quest, we recommend enabling
            your notification settings for QuestBoard.
          </p>
          <div className=''>
            <button
              onClick={onEnable}
              type='button'
              className={cn(
                'cursor-pointer',
                'w-full px-3 py-2 flex items-center justify-center gap-3',
                'bg-gray-300/10 hover:bg-gray-300/30 transition-colors'
              )}
            >
              <span>Enable Notification</span>
            </button>
          </div>
        </div>
      </ScrollableContent>
    </Dialog>
  )
}
