import { useAtomValue, useSetAtom } from 'jotai'
import { FC, useEffect } from 'react'
import { PROGRAM_ID, programAtom } from '../atoms/programAtom'
import { configAtom } from '../atoms/configAtom'
import { useUserWallet } from '../atoms/userWalletAtom'
import { PublicKey } from '@solana/web3.js'

export const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('config')],
  PROGRAM_ID
)

export const ConfigListener: FC = () => {
  const wallet = useUserWallet()
  const program = useAtomValue(programAtom)
  const setConfig = useSetAtom(configAtom)

  useEffect(() => {
    if (!program) return

    program.account.config.fetchNullable(configPda).then((configAccount) => {
      setConfig(configAccount)
    })

    const subscriptionId = program.provider.connection.onAccountChange(
      configPda,
      (accountInfo) => {
        const configAccount = program.account.config.coder.accounts.decode(
          'Config',
          accountInfo.data
        )

        // TODO
        console.log(configAccount)
      }
    )

    return () => {
      program.provider.connection.removeAccountChangeListener(subscriptionId)
    }
  }, [wallet, program, setConfig])

  return null
}
