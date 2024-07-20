import { useAtomValue, useSetAtom } from 'jotai'
import { FC, useEffect } from 'react'
import { PROGRAM_ID, programAtom } from '../atoms/programAtom'
import { counterAtom } from '../atoms/counterAtom'
import { useUserWallet } from '../atoms/userWalletAtom'
import { PublicKey } from '@solana/web3.js'

export const [counterPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('counter')],
  PROGRAM_ID
)

export const CounterListener: FC = () => {
  const wallet = useUserWallet()
  const program = useAtomValue(programAtom)
  const setCounter = useSetAtom(counterAtom)

  useEffect(() => {
    if (!program) return

    program.account.counter.fetchNullable(counterPda).then((counterAccount) => {
      setCounter(counterAccount)
    })

    const subscriptionId = program.provider.connection.onAccountChange(
      counterPda,
      (accountInfo) => {
        const counterAccount = program.account.counter.coder.accounts.decode(
          'counter',
          accountInfo.data
        )

        setCounter(counterAccount)
      }
    )

    return () => {
      program.provider.connection.removeAccountChangeListener(subscriptionId)
    }
  }, [wallet, program, setCounter])

  return null
}
