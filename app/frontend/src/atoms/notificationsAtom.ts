import { atom } from 'jotai'

export interface Notification {
  id: string
  message: string
  messageType: string
  visitorAddress: string
  visitorSessionAddress: string
  timestamp: number
}

export const notificationsAtom = atom<Notification[]>([])
