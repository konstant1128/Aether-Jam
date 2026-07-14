import {create} from 'zustand';
import { combine } from 'zustand/middleware';

interface Peer {
    connectionId: string;
    displayName: string;
    instrument: string;
}

interface Room{
    id: string;
    name: string;
    peers: Peer[];
}

interface AppState{
    //network state
    isConnected: boolean;
    currentRoom: Room | null;
    peers: Peer[];

    //actions
    setConnected: (connected: boolean) => void;
    setCurrentRoom: (room: Room | null) => void;
    setPeers: (peers: Peer[]) => void;
    addPeer: (peers: Peer) => void;
    removePeer: (connectionId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  isConnected: false,
  currentRoom: null,
  peers: [],
  
  setConnected: (connected) => set({ isConnected: connected }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setPeers: (peers) => set({ peers }),
  addPeer: (peer) => set((state) => ({ 
    peers: [...state.peers.filter(p => p.connectionId !== peer.connectionId), peer] 
  })),
  removePeer: (connectionId) => set((state) => ({ 
    peers: state.peers.filter(p => p.connectionId !== connectionId) 
  })),
}));

