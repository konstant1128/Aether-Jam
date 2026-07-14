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

  // Конфигурация ICE серверов (STUN для обхода NAT)
  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  async initialize(roomId: string) {
    this.localRoomId = roomId;
    console.log('PeerManager initialized for room:', roomId);

    // Регистрируем колбэки на сигнальные сообщения
    trackerClient.onSDPReceived(async (connectionId, sdp) => {
      await this.handleSDP(connectionId, sdp);
    });

    trackerClient.onICEReceived(async (connectionId, candidate) => {
      await this.handleICE(connectionId, candidate);
    });

    // Когда новый пир присоединяется — создаем для него соединение
    trackerClient.onPeerJoined(async (peer) => {
      await this.createPeerConnection(peer.connectionId);
    });

    // Когда пир уходит — закрываем соединение
    trackerClient.onPeerLeft((connectionId) => {
      this.closePeerConnection(connectionId);
    });

    // Подключаемся к уже существующим пирам
    const peers = useStore.getState().peers;
    for (const peer of peers) {
      await this.createPeerConnection(peer.connectionId);
    }
  }

  // Создание P2P соединения с пиром
  private async createPeerConnection(remoteConnectionId: string) {
    // Если соединение уже есть — не создаем дубликат
    if (this.peerConnections.has(remoteConnectionId)) return;

    const peerConnection = new RTCPeerConnection(this.iceServers);
    
    const peerConn: PeerConnection = {
      connectionId: remoteConnectionId,
      peerConnection,
      dataChannel: null
    };

    this.peerConnections.set(remoteConnectionId, peerConn);

    // Обработка ICE кандидатов
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.localRoomId) {
        trackerClient.sendICE(remoteConnectionId, JSON.stringify(event.candidate));
      }
    };

    // Когда получаем DataChannel от удаленного пира
    peerConnection.ondatachannel = (event) => {
      this.handleDataChannel(remoteConnectionId, event.channel);
    };

    // Создаем DataChannel (только один пир должен создать, другой примет)
    // Для простоты: кто присоединился позже — создает
    const dataChannel = peerConnection.createDataChannel('notes', {
      ordered: true, // Надежная доставка для нот
      maxRetransmits: 3
    });

    this.handleDataChannel(remoteConnectionId, dataChannel);

    // Создаем SDP offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Отправляем offer через трекер
      await trackerClient.sendSDP(remoteConnectionId, JSON.stringify(offer));
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  }

  // Обработка полученного SDP
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

  // Обработка ICE кандидата
  private async handleICE(remoteConnectionId: string, candidateStr: string) {
    const peerConn = this.peerConnections.get(remoteConnectionId);
    if (!peerConn) return;

    const candidate = JSON.parse(candidateStr);
    await peerConn.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // Обработка DataChannel
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

  // Обработка входящих сообщений (нот)
  private handleMessage(remoteConnectionId: string, data: string) {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'note_on') {
        audioEngine.noteOn(message.note, message.velocity);
        useStore.getState().addActiveNote(message.note);
      } else if (message.type === 'note_off') {
        audioEngine.noteOff(message.note);
        useStore.getState().removeActiveNote(message.note);
      }
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  }

  // Отправка ноты всем пирам
  broadcastNote(type: 'note_on' | 'note_off', note: number, velocity: number) {
    const message = JSON.stringify({ type, note, velocity });

    this.peerConnections.forEach((peerConn) => {
      if (peerConn.dataChannel && peerConn.dataChannel.readyState === 'open') {
        peerConn.dataChannel.send(message);
      }
    });
  }

  // Закрытие соединения с пиром
  private closePeerConnection(connectionId: string) {
    const peerConn = this.peerConnections.get(connectionId);
    if (peerConn) {
      peerConn.dataChannel?.close();
      peerConn.peerConnection.close();
      this.peerConnections.delete(connectionId);
    }
  }

  // Очистка всех соединений
  cleanup() {
    this.peerConnections.forEach((peerConn) => {
      peerConn.dataChannel?.close();
      peerConn.peerConnection.close();
    });
    this.peerConnections.clear();
  }
}

export const peerManager = new PeerManager();