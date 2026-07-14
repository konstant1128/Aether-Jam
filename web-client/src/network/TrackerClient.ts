import * as signalR from '@microsoft/signalr';
import { useStore } from '../store/useStore';

class TrackerClient {
  private connection: signalR.HubConnection | null = null;
  
  private onSDPReceivedCallback: ((connectionId: string, sdp: string) => void) | null = null;
  private onICEReceivedCallback: ((connectionId: string, candidate: string) => void) | null = null;
  private onPeerJoinedCallback: ((peer: any) => void) | null = null;
  private onPeerLeftCallback: ((connectionId: string) => void) | null = null;
  private onCurrentPeersCallback: ((peers: any[]) => void) | null = null;

  async connect(url: string) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .withAutomaticReconnect()
      .build();

    this.connection.on('SDPReceived', (connectionId: string, sdp: string) => {
      console.log('SDP received from:', connectionId);
      this.onSDPReceivedCallback?.(connectionId, sdp);
    });

    this.connection.on('ICEReceived', (connectionId: string, candidate: string) => {
      console.log('ICE received from:', connectionId);
      this.onICEReceivedCallback?.(connectionId, candidate);
    });

    this.connection.on('PeerJoined', (peer) => {
      console.log('Peer joined:', peer);
      useStore.getState().addPeer(peer);
      this.onPeerJoinedCallback?.(peer);
    });

    this.connection.on('PeerLeft', (connectionId: string) => {
      console.log('Peer left:', connectionId);
      useStore.getState().removePeer(connectionId);
      this.onPeerLeftCallback?.(connectionId);
    });

    this.connection.on('CurrentPeers', (peers: any[]) => {
      console.log('Current peers:', peers);
      useStore.getState().setPeers(peers);
      this.onCurrentPeersCallback?.(peers);
    });

    try {
      await this.connection.start();
      useStore.getState().setConnected(true);
      console.log('Connected to tracker');
    } catch (err) {
      console.error('Connection failed:', err);
      throw err;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      useStore.getState().setConnected(false);
    }
  }

  async createRoom(roomName: string) {
    if (!this.connection) throw new Error('Not connected');
    const room = await this.connection.invoke('CreateRoom', roomName);
    return room;
  }

  async joinRoom(roomId: string, displayName: string, instrument: string) {
    if (!this.connection) throw new Error('Not connected');
    const success = await this.connection.invoke('JoinRoom', roomId, displayName, instrument);
    return success;
  }

  async leaveRoom(roomId: string) {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('LeaveRoom', roomId);
  }

  async getRooms() {
    if (!this.connection) throw new Error('Not connected');
    const rooms = await this.connection.invoke('GetRooms');
    return rooms;
  }

  //WebRTC Signaling методы
  
  async sendSDP(targetConnectionId: string, sdp: string) {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('ExchangeSDP', targetConnectionId, sdp);
  }

  async sendICE(targetConnectionId: string, candidate: string) {
    if (!this.connection) throw new Error('Not connected');
    await this.connection.invoke('ExchangeICE', targetConnectionId, candidate);
  }

  // Колбэки
  onSDPReceived(callback: (connectionId: string, sdp: string) => void) {
    this.onSDPReceivedCallback = callback;
  }

  onICEReceived(callback: (connectionId: string, candidate: string) => void) {
    this.onICEReceivedCallback = callback;
  }

  onPeerJoined(callback: (peer: any) => void) {
    this.onPeerJoinedCallback = callback;
  }

  onPeerLeft(callback: (connectionId: string) => void) {
    this.onPeerLeftCallback = callback;
  }

  onCurrentPeers(callback: (peers: any[]) => void) {
    this.onCurrentPeersCallback = callback;
  }
}

export const trackerClient = new TrackerClient();