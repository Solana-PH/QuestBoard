import { atom } from 'jotai'

export const daoBalanceAtom = atom<number | null>(null)
export const daoBalanceFormattedAtom = atom((get) => {
  const daoBalance = get(daoBalanceAtom)
  if (daoBalance == null) return null
  return (daoBalance / 10 ** 9).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
})
