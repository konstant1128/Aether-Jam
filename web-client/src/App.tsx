import { useEffect, useState } from 'react';
import { trackerClient } from './network/TrackerClient';
import { peerManager } from './network/PeerManager';
import { audioEngine } from './audio/AudioEngine';
import { RoomList } from './components/RoomList';
import { PianoKeyboard } from './components/PianoKeyboard';
import { useStore } from './store/useStore';
import { useKeyboard } from './hooks/useKeyboard';
import './App.css';

function App() {
  const { isConnected, currentRoom } = useStore();
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  useKeyboard();

  useEffect(() => {
    trackerClient.connect('http://localhost:5201/sync').catch(err => {
      console.error('Failed to connect:', err);
    });

    return () => {
      trackerClient.disconnect();
      peerManager.cleanup();
    };
  }, []);

  // Инициализируем PeerManager при входе в комнату
  useEffect(() => {
    if (currentRoom) {
      peerManager.initialize(currentRoom.id);
    } else {
      peerManager.cleanup();
    }
  }, [currentRoom]);

  const handlePlayNote = () => {
    if (!isAudioInitialized) {
      audioEngine.init();
      setIsAudioInitialized(true);
    }
    audioEngine.noteOn(60, 100);
    setTimeout(() => audioEngine.noteOff(60), 500);
  };

  return (
    <div className="app">
      <header>
        <h1>Aether Jam</h1>
        <div className="status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main>
        <RoomList />
        
        <div className="synth-controls">
          <h2>Synthesizer</h2>
          <PianoKeyboard />
          <button className="play-button" onClick={handlePlayNote} style={{ marginTop: '20px' }}>
            Play Note (C4)
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;