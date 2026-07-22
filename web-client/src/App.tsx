import { useEffect, useState } from 'react';
import { trackerClient } from './network/TrackerClient';
import { peerManager } from './network/PeerManager';
import { audioEngine } from './audio/AudioEngine';
import { RoomList } from './components/RoomList';
import { PianoKeyboard } from './components/PianoKeyboard';
import { Scene3D } from './components/Scene3D';
import { InstrumentSelector } from './components/InstrumentSelector';
import { DrumPads } from './components/DrumPads';
import { EffectsPanel } from './components/EffectsPanel';
import { useStore } from './store/useStore';
import { useKeyboard } from './hooks/useKeyboard';
import './App.css';

function App() {
  const { isConnected, currentRoom } = useStore();
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [currentInstrument, setCurrentInstrument] = useState('synth');

  useKeyboard();

  useEffect(() => {
    const trackerUrl = import.meta.env.VITE_TRACKER_URL || 'http://localhost:5201/sync';
    trackerClient.connect(trackerUrl).catch(err => {
      console.error('Failed to connect:', err);
    });

    return () => {
      trackerClient.disconnect();
      peerManager.cleanup();
    };
  }, []);

  useEffect(() => {
    if (currentRoom) {
      peerManager.initialize(currentRoom.id);
    } else {
      peerManager.cleanup();
    }
  }, [currentRoom]);

  // Следим за инструментом
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInstrument(audioEngine.getCurrentInstrument());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePlayNote = () => {
    if (!isAudioInitialized) {
      audioEngine.init();
      setIsAudioInitialized(true);
    }
    audioEngine.noteOn(60, 100);
    setTimeout(() => audioEngine.noteOff(60), 500);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Aether Jam</h1>
        <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <main className="app-main">
        {/* Верхний ряд: комнаты + 3D сцена */}
        <div className="row top-row">
          <div className="room-section">
            <RoomList />
          </div>
          {currentRoom && (
            <div className="scene-section">
              <Scene3D />
            </div>
          )}
        </div>

        {/* Второй ряд: выбор инструмента */}
        {currentRoom && (
          <div className="row">
            <InstrumentSelector />
          </div>
        )}

        {/* Третий ряд: эффекты */}
        {currentRoom && (
          <div className="row">
            <EffectsPanel />
          </div>
        )}

        {/* Четвертый ряд: синтезатор ИЛИ драм-пэды */}
        {currentRoom && (
          <div className="row bottom-row">
            {currentInstrument === 'drums' ? (
              <div className="drum-section">
                <DrumPads />
              </div>
            ) : (
              <div className="synth-section">
                <h2 className="section-title">Synthesizer</h2>
                <PianoKeyboard />
                <button className="play-note-btn" onClick={handlePlayNote}>
                  Play Note (C4)
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;