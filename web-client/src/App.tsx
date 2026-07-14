import { useEffect, useState } from 'react';
import { trackerClient } from './network/TrackerClient';
import { audioEngine } from './audio/AudioEngine';
import { RoomList } from './components/RoomList';
import { useStore } from './store/useStore';
import './App.css';

function App() {
  const { isConnected } = useStore();
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  useEffect(() => {
    // Подключаемся к трекеру при загрузке
    trackerClient.connect('http://localhost:5001/sync').catch(err => {
      console.error('Failed to connect:', err);
    });

    return () => {
      trackerClient.disconnect();
    };
  }, []);

  const handlePlayNote = () => {
    if (!isAudioInitialized) {
      audioEngine.init();
      setIsAudioInitialized(true);
    }
    // Играем ноту C4 (MIDI 60)
    audioEngine.playNote(audioEngine.midiToFrequency(60), 0.5);
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
          <button className="play-button" onClick={handlePlayNote}>
            Play Note (C4)
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;