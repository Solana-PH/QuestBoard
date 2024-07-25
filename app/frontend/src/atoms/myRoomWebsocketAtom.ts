import { atom } from 'jotai'
import PartySocket from 'partysocket'

export const myRoomWebsocketAtom = atom<PartySocket | null>(null)
