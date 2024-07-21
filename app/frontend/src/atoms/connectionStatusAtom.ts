import { atom } from 'jotai'

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
}

export const connectionStatusAtom = atom<ConnectionStatus>(
  ConnectionStatus.DISCONNECTED
)
