import { useWallet } from '@solana/wallet-adapter-react'
import { Wallet, Note, BellRinging, Bell } from '@phosphor-icons/react'
import { FC } from 'react'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  MenuSeparator,
} from '@headlessui/react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { trimAddress } from '../utils/trimAddress'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { solBalanceFormattedAtom } from '../atoms/solBalanceAtom'
import { daoBalanceFormattedAtom } from '../atoms/daoBalanceAtom'
import { Dialogs, showDialogAtom } from '../atoms/showDialogAtom'
import {
  ConnectionStatus,
  connectionStatusAtom,
} from '../atoms/connectionStatusAtom'
import cn from 'classnames'
import { searchAtom } from '../atoms/searchAtom'
import { Link } from 'react-router-dom'
import { notificationsAtom } from '../atoms/notificationsAtom'

export const ActionBar: FC = () => {
  const { disconnect, publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const solBalance = useAtomValue(solBalanceFormattedAtom)
  const daoBalance = useAtomValue(daoBalanceFormattedAtom)
  const setShowDialog = useSetAtom(showDialogAtom)
  const connectionStatus = useAtomValue(connectionStatusAtom)
  const [search, setSearch] = useAtom(searchAtom)
  const notif = useAtomValue(notificationsAtom)

  return (
    <div className='animate-fadeIn flex flex-none px-2 h-16 bg-black/50 items-center justify-between gap-5'>
      <div className='flex flex-auto items-center px-3 gap-5 max-w-3xl'>
        <img
          src='/QuestBoardLogo.svg'
          alt='QuestBoard'
          className='aspect-square object-contain h-10 w-10 flex-none'
        />
        <div className='w-full hidden md:flex flex-auto'>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type='text'
            placeholder='Search Quests'
            className='bg-transparent px-3 py-2 w-full placeholder-stone-500 text-white'
          />
        </div>
      </div>
      <div className='flex-none flex items-center gap-5'>
        <Link
          to='/notifications'
          className={cn('py-2 flex items-center gap-2')}
        >
          {notif.length > 0 ? (
            <>
              <div className='animate-shake'>
                <BellRinging size={32} />
              </div>
              <span className='text-white font-bold bg-red-600 px-2 py-1 rounded'>
                {notif.length}
              </span>
            </>
          ) : (
            <>
              <Bell size={32} />
            </>
          )}
        </Link>
        <Menu>
          <MenuButton className='px-3 py-2 flex items-center gap-2'>
            <Wallet size={32} />
            {publicKey && (
              <span className='flex items-center gap-2'>
                <span className='hidden xl:inline'>
                  {trimAddress(publicKey.toBase58())}
                </span>
                <span
                  className={cn(
                    'rounded-full w-2 h-2 flex-none',
                    ConnectionStatus.CONNECTED === connectionStatus &&
                      'bg-green-500',
                    ConnectionStatus.CONNECTING === connectionStatus &&
                      'bg-amber-500 animate-pulse'
                  )}
                />
              </span>
            )}
          </MenuButton>
          <MenuItems
            anchor='bottom'
            className='w-52 flex flex-col p-1 bg-black/80 backdrop-blur'
          >
            <div className='flex flex-col gap-2 py-2'>
              <p className='px-3 text-xs flex items-center justify-between'>
                <span className='opacity-50 font-bold'>SOL</span>
                {solBalance ? (
                  <span className='tabular-nums'>{solBalance}</span>
                ) : (
                  <span className='rounded h-4 w-20 animate-pulse bg-white/20'></span>
                )}
              </p>
              <p className='px-3 text-xs flex items-center justify-between'>
                <span className='opacity-50 font-bold'>DAO</span>
                {daoBalance ? (
                  <span className='tabular-nums'>{daoBalance}</span>
                ) : (
                  <span className='rounded h-4 w-32 animate-pulse bg-white/20'></span>
                )}
              </p>
            </div>
            <MenuSeparator className='my-1' />
            {/* 
            <MenuItem>
              <button
                onClick={() => {}}
                className='bg-amber-300/5 px-3 py-2 text-left data-[focus]:bg-amber-300/10 transition-colors'
              >
                Go Offline
              </button>
            </MenuItem>
             */}
            <MenuItem>
              <button
                onClick={() => setVisible(true)}
                className='bg-amber-300/5 px-3 py-2 text-left data-[focus]:bg-amber-300/10 transition-colors'
              >
                Change Wallet
              </button>
            </MenuItem>
            <MenuItem>
              <button
                onClick={disconnect}
                className='bg-amber-300/5 px-3 py-2 text-left data-[focus]:bg-amber-300/10 transition-colors'
              >
                Disconnect
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
        <button
          onClick={() => setShowDialog(Dialogs.CREATE_QUEST)}
          className='px-3 py-2 flex items-center gap-3 bg-amber-300/10 hover:bg-amber-300/30 transition-colors'
        >
          <Note size={32} />
          <span className='hidden xl:inline'>Post a Quest</span>
        </button>
      </div>
    </div>
  )
}
