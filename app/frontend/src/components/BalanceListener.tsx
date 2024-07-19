import { useAtomValue, useSetAtom } from 'jotai'
import { solBalanceAtom } from '../atoms/solBalanceAtom'
import { useUserWallet } from '../atoms/userWalletAtom'
import { useConnection } from '@solana/wallet-adapter-react'
import { useEffect } from 'react'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import { configAtom } from '../atoms/configAtom'
import { daoBalanceAtom } from '../atoms/daoBalanceAtom'
import { userDaoAtaAtom } from '../atoms/daoTokenMintAtom'
import { AccountLayout, getAccount } from '@solana/spl-token'

export const BalanceListener = () => {
  const wallet = useUserWallet()
  const { connection } = useConnection()
  const setSolBalance = useSetAtom(solBalanceAtom)
  const setDaoBalance = useSetAtom(daoBalanceAtom)
  const daoAta = useAtomValue(userDaoAtaAtom)

  useEffect(() => {
    if (!wallet?.publicKey) return

    connection.getBalance(wallet.publicKey).then((balance) => {
      const solBalance = balance
      setSolBalance(solBalance)
    })

    const subscriptionId = connection.onAccountChange(
      wallet.publicKey,
      (accountInfo) => {
        const balance = accountInfo.lamports
        setSolBalance(balance)
      }
    )

    return () => {
      connection.removeAccountChangeListener(subscriptionId)
    }
  }, [wallet, connection, setSolBalance])

  useEffect(() => {
    if (!daoAta) {
      setDaoBalance(null)
      return
    }

    const ata = new PublicKey(daoAta)

    getAccount(connection, ata)
      .then((tokenAccountInfo) => {
        const balance = Number(tokenAccountInfo.amount)
        setDaoBalance(balance)
      })
      .catch(() => {
        setDaoBalance(0)
      })

    const listenToSPLBalanceChanges = async () => {
      const subscriptionId = connection.onAccountChange(
        ata,
        (accountInfo: AccountInfo<Buffer>) => {
          const tokenAccountData = AccountLayout.decode(accountInfo.data)
          const newBalance = Number(tokenAccountData.amount)
          setDaoBalance(newBalance)
        }
      )

      return () => {
        connection.removeAccountChangeListener(subscriptionId)
      }
    }

    const cleanupPromise = listenToSPLBalanceChanges()

    return () => {
      cleanupPromise.then((cleanup) => cleanup && cleanup())
    }
  }, [daoAta, connection, setDaoBalance])

  return null
}
