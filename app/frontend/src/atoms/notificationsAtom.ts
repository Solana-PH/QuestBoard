import { atom } from 'jotai'

export enum NotificationMessageType {
  QUEST_PROPOSAL = 'quest_proposal',
  QUEST_ACCEPTED = 'quest_accepted',
  QUEST_REJECTED = 'quest_rejected',
}

export type NotificationMessage = {
  quest: string
  content: string
  minStake: number
}

export interface Notification {
  id: string
  message: string
  messageType: NotificationMessageType
  visitorAddress: string
  visitorNotifAddress: string
  timestamp: number
}

export const notificationsAtom = atom<Notification[]>([])