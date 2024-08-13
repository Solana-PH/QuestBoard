import { useWallet } from '@solana/wallet-adapter-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { FC, ReactNode, Suspense, useEffect, useRef } from 'react'
import { userWalletAtom, useUserWallet } from './userWalletAtom'
import { idbAtom, Message, QuestBoardIDBSchema } from './idbAtom'
import { rpcEndpointAtom } from './rpcEndpointAtom'
import { openDB } from 'idb'

export const IdbInitializer: FC<{ children: ReactNode }> = ({ children }) => {
  const rpcEndpoint = useAtomValue(rpcEndpointAtom)
  const wallet = useUserWallet()
  const setIdb = useSetAtom(idbAtom)

  useEffect(() => {
    if (indexedDB && rpcEndpoint && wallet?.publicKey) {
      const initDb = async () => {
        if (!rpcEndpoint) return
        if (!wallet?.publicKey) return

        const idb = await openDB<QuestBoardIDBSchema>(
          `questboard_${rpcEndpoint}_${wallet.publicKey.toBase58()}`,
          1,
          {
            upgrade(db, oldVersion) {
              switch (oldVersion) {
                case 0:
                case 1: {
                  db.createObjectStore('proposal_hash')
                  db.createObjectStore('session_keys', {
                    keyPath: 'id',
                  })
                  db.createObjectStore('files', {
                    keyPath: 'id',
                  }).createIndex('questId', 'questId', { unique: false })
                  db.createObjectStore('quest', {
                    keyPath: 'id',
                  })
                  const messageStore = db.createObjectStore('messages', {
                    keyPath: 'hash',
                  })
                  messageStore.createIndex('questId', 'questId', {
                    unique: false,
                  })
                  messageStore.createIndex('senderAddress', 'senderAddress', {
                    unique: false,
                  })
                }
              }
            },
          }
        )

        setIdb(idb)
      }

      void initDb()
    }
  }, [setIdb, wallet, rpcEndpoint])

  return children
}

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

  return (
    <Suspense fallback={null}>
      <IdbInitializer>{children}</IdbInitializer>
    </Suspense>
  )
}
