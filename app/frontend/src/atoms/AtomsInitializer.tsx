import { useWallet } from '@solana/wallet-adapter-react'
import { useSetAtom } from 'jotai'
import { FC, ReactNode, useEffect, useRef } from 'react'
import { userWalletAtom } from './userWalletAtom'

export const AtomsInitializer: FC<{ children: ReactNode }> = ({ children }) => {
  const walletContextStateSerialized = useRef('')
  const walletContextState = useWallet()
  const setUserWalletContextState = useSetAtom(userWalletAtom)

  useEffect(() => {
    const serialized = JSON.stringify({
      wallet: walletContextState.wallet?.readyState,
      publicKey: walletContextState.publicKey,
      connected: walletContextState.connected,
      connecting: walletContextState.connecting,
      disconnecting: walletContextState.disconnecting,
    })

    if (walletContextStateSerialized.current !== serialized) {
      walletContextStateSerialized.current = serialized

      setUserWalletContextState(walletContextState)
    }
  }, [walletContextState, setUserWalletContextState])

  return children
}
