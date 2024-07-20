import { atom } from 'jotai'

export enum Dialogs {
  NONE,
  CREATE_QUEST,
}

export const showDialogAtom = atom<Dialogs>(Dialogs.NONE)
