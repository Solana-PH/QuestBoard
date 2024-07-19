import { useWallet } from '@solana/wallet-adapter-react'
import { Wallet, Note } from '@phosphor-icons/react'
import { FC } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { trimAddress } from '../utils/trimAddress'

export const ActionBar: FC = () => {
  const { disconnect, publicKey } = useWallet()
  const { setVisible } = useWalletModal()

  return (
    <div className='animate-fadeIn flex flex-none px-2 h-16 bg-black/50 items-center justify-between gap-5'>
      <div className='flex flex-auto items-center px-3 gap-5 max-w-3xl'>
        <img
          src='/QuestBoardLogo.svg'
          alt='QuestBoard'
          className='aspect-square object-contain h-10 w-10 flex-none'
        />
        <div className='w-full hidden landscape:flex flex-auto'>
          <input
            type='text'
            placeholder='Search Quests'
            className='bg-transparent border-b border-white/50 text-white px-3 py-2 w-full'
          />
        </div>
      </div>
      <div className='flex-none flex items-center gap-5'>
        <Menu>
          <MenuButton className='px-3 py-2 flex items-center gap-3'>
            <Wallet size={32} />
            {publicKey && (
              <span className='hidden xl:inline'>
                {trimAddress(publicKey.toBase58())}
              </span>
            )}
          </MenuButton>
          <MenuItems
            anchor='bottom'
            className='w-52 flex flex-col p-1 bg-amber-300/5 backdrop-blur'
          >
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
        <button className='px-3 py-2 flex items-center gap-3 bg-amber-300/10 hover:bg-amber-300/30 transition-colors'>
          <Note size={32} />
          <span className='hidden xl:inline'>Post a Quest</span>
        </button>
      </div>
    </div>
  )
}
