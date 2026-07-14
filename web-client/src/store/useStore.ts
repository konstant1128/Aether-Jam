import { create } from 'zustand';

interface Peer {
  connectionId: string;
  displayName: string;
  instrument: string;
}

interface Room {
  id: string;
  name: string;
  peers: Peer[];
}

interface AppState {
  isConnected: boolean;
  currentRoom: Room | null;
  peers: Peer[];
  
  activeNotes: Set<number>;
  
  setConnected: (connected: boolean) => void;
  setCurrentRoom: (room: Room | null) => void;
  setPeers: (peers: Peer[]) => void;
  addPeer: (peer: Peer) => void;
  removePeer: (connectionId: string) => void;
  setActiveNotes: (notes: Set<number>) => void;
  addActiveNote: (note: number) => void;
  removeActiveNote: (note: number) => void;
}

export const useStore = create<AppState>((set) => ({
  isConnected: false,
  currentRoom: null,
  peers: [],
  activeNotes: new Set(),
  
  setConnected: (connected) => set({ isConnected: connected }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setPeers: (peers) => set({ peers }),
  addPeer: (peer) => set((state) => ({ 
    peers: [...state.peers.filter(p => p.connectionId !== peer.connectionId), peer] 
  })),
  removePeer: (connectionId) => set((state) => ({ 
    peers: state.peers.filter(p => p.connectionId !== connectionId) 
  })),
  setActiveNotes: (notes) => set({ activeNotes: notes }),
  addActiveNote: (note) => set((state) => {
    const newNotes = new Set(state.activeNotes);
    newNotes.add(note);
    return { activeNotes: newNotes };
  }),
  removeActiveNote: (note) => set((state) => {
    const newNotes = new Set(state.activeNotes);
    newNotes.delete(note);
    return { activeNotes: newNotes };
  }),
}));