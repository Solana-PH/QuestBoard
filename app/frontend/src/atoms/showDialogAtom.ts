import { atom } from 'jotai'

export enum Dialogs {
  NONE,
  CREATE_QUEST,
  ENABLE_NOTIF,
}

export const showDialogAtom = atom<Dialogs>(Dialogs.NONE)
