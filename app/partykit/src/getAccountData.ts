import { getAccountInfo } from './getAccountInfo'

export async function getAccountData(address: string) {
  const accountInfo = await getAccountInfo(address)
  if (accountInfo.value === null) return null

  return Uint8Array.from(atob(accountInfo.value.data[0]), (c) =>
    c.charCodeAt(0)
  )
}
