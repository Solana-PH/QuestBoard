import { atom } from 'jotai'

const blockedAddressesRawAtom = atom('')

export const blockedAddressesAtom = atom(
  (get) => {
    const raw = get(blockedAddressesRawAtom)
    return raw.split(',').filter((x) => x)
  },
  (_, set, newValue: string[]) => {
    set(blockedAddressesRawAtom, newValue.filter((x) => x).join(','))
  }
)
