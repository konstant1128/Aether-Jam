// src/network/PeerManager.ts
import { trackerClient } from './TrackerClient';
import { audioEngine } from '../audio/AudioEngine';
import { useStore } from '../store/useStore';

interface PeerConnection {
  connectionId: string;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

class PeerManager {
  private peerConnections = new Map<string, PeerConnection>();
  private localRoomId: string | null = null;
  private onParamChangeCallback: ((param: string, value: number) => void) | null = null;
  private onInstrumentChangeCallback: ((connectionId: string, instrument: string) => void) | null = null;

  // STUN + TURN серверы для работы через интернет
  private iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  };

  async initialize(roomId: string) {
    this.localRoomId = roomId;
    console.log('PeerManager initialized for room:', roomId);

    trackerClient.onSDPReceived(async (connectionId: string, sdp: string) => {
      await this.handleSDP(connectionId, sdp);
    });

    trackerClient.onICEReceived(async (connectionId: string, candidate: string) => {
      await this.handleICE(connectionId, candidate);
    });

    trackerClient.onPeerJoined(async (peer: any) => {
      await this.createPeerConnection(peer.connectionId);
    });

    trackerClient.onPeerLeft((connectionId: string) => {
      this.closePeerConnection(connectionId);
      useStore.getState().removePeerInstrument(connectionId);
    });

    // Подключаемся к уже существующим пирам
    const peers = useStore.getState().peers;
    for (const peer of peers) {
      await this.createPeerConnection(peer.connectionId);
    }
  }

  private async createPeerConnection(remoteConnectionId: string) {
    if (this.peerConnections.has(remoteConnectionId)) return;

    const peerConnection = new RTCPeerConnection(this.iceServers);

    const peerConn: PeerConnection = {
      connectionId: remoteConnectionId,
      peerConnection,
      dataChannel: null
    };

    this.peerConnections.set(remoteConnectionId, peerConn);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.localRoomId) {
        trackerClient.sendICE(remoteConnectionId, JSON.stringify(event.candidate));
      }
    };

    peerConnection.ondatachannel = (event) => {
      this.handleDataChannel(remoteConnectionId, event.channel);
    };

    // Создаем DataChannel
    const dataChannel = peerConnection.createDataChannel('notes', {
      ordered: true,
      maxRetransmits: 3
    });

    this.handleDataChannel(remoteConnectionId, dataChannel);

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await trackerClient.sendSDP(remoteConnectionId, JSON.stringify(offer));
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  }

  private async handleSDP(remoteConnectionId: string, sdpStr: string) {
    const peerConn = this.peerConnections.get(remoteConnectionId);
    if (!peerConn) return;

    const sdp = JSON.parse(sdpStr);

    if (sdp.type === 'offer') {
      await peerConn.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConn.peerConnection.createAnswer();
      await peerConn.peerConnection.setLocalDescription(answer);
      await trackerClient.sendSDP(remoteConnectionId, JSON.stringify(answer));
    } else if (sdp.type === 'answer') {
      await peerConn.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  private async handleICE(remoteConnectionId: string, candidateStr: string) {
    const peerConn = this.peerConnections.get(remoteConnectionId);
    if (!peerConn) return;

    const candidate = JSON.parse(candidateStr);
    await peerConn.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private handleDataChannel(remoteConnectionId: string, channel: RTCDataChannel) {
    const peerConn = this.peerConnections.get(remoteConnectionId);
    if (peerConn) {
      peerConn.dataChannel = channel;
    }

    channel.onopen = () => {
      console.log(`DataChannel open with ${remoteConnectionId}`);
    };

    channel.onmessage = (event) => {
      this.handleMessage(remoteConnectionId, event.data);
    };

    channel.onclose = () => {
      console.log(`DataChannel closed with ${remoteConnectionId}`);
    };
  }

    private handleMessage(remoteConnectionId: string, data: string) {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'note_on') {
        audioEngine.noteOn(message.note, message.velocity);
        useStore.getState().addActiveNote(message.note);
      } else if (message.type === 'note_off') {
        audioEngine.noteOff(message.note);
        useStore.getState().removeActiveNote(message.note);
      } else if (message.type === 'param_change') {
        console.log(`Param change from ${remoteConnectionId}: ${message.param} = ${message.value}`);
        audioEngine.applyRemoteParam(message.param, message.value);
        if (this.onParamChangeCallback) {
          this.onParamChangeCallback(message.param, message.value);
        }
      } else if (message.type === 'instrument_change') {
        console.log(`Instrument change from ${remoteConnectionId}: ${message.instrument}`);
        useStore.getState().setPeerInstrument(remoteConnectionId, message.instrument);
        if (this.onInstrumentChangeCallback) {
          this.onInstrumentChangeCallback(remoteConnectionId, message.instrument);
        }
      }
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  }

  broadcastNote(type: 'note_on' | 'note_off', note: number, velocity: number) {
    const message = JSON.stringify({ type, note, velocity });

    this.peerConnections.forEach((peerConn) => {
      if (peerConn.dataChannel && peerConn.dataChannel.readyState === 'open') {
        peerConn.dataChannel.send(message);
      }
    });
  }

  broadcastParam(param: string, value: number) {
    const message = JSON.stringify({ type: 'param_change', param, value });

    this.peerConnections.forEach((peerConn) => {
      if (peerConn.dataChannel && peerConn.dataChannel.readyState === 'open') {
        peerConn.dataChannel.send(message);
      }
    });
  }

  broadcastInstrumentChange(instrument: string) {
    const message = JSON.stringify({ type: 'instrument_change', instrument });

    this.peerConnections.forEach((peerConn) => {
      if (peerConn.dataChannel && peerConn.dataChannel.readyState === 'open') {
        peerConn.dataChannel.send(message);
      }
    });
  }

onParamChange = (callback: (param: string, value: number) => void): void => {
  this.onParamChangeCallback = callback;
}

onInstrumentChange = (callback: (connectionId: string, instrument: string) => void): void => {
  this.onInstrumentChangeCallback = callback;
}

  private closePeerConnection(connectionId: string) {
    const peerConn = this.peerConnections.get(connectionId);
    if (peerConn) {
      peerConn.dataChannel?.close();
      peerConn.peerConnection.close();
      this.peerConnections.delete(connectionId);
    }
  }

  cleanup() {
    this.peerConnections.forEach((peerConn) => {
      peerConn.dataChannel?.close();
      peerConn.peerConnection.close();
    });
    this.peerConnections.clear();
    this.localRoomId = null;
  }
}

export const peerManager = new PeerManager();