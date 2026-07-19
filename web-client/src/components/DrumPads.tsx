import { useState, useEffect } from 'react';
import { drumMachine } from "../audio/DrumMAchine";
import { useStore } from '../store/useStore';

const PAD_COLORS = [
  '#e94560', '#f39c12', '#27ae60', '#3498db',
  '#9b59b6', '#1abc9c', '#e67e22', '#e74c3c',
  '#34495e', '#16a085', '#c0392b', '#8e44ad'
];

export function DrumPads() {
  const { activeNotes } = useStore();
  const [loadedSamples, setLoadedSamples] = useState<Set<number>>(new Set());

  useEffect(() => {
    //проверяем загруженные семплы каждые 500ms
    const interval = setInterval(() => {
      const loaded = new Set<number>();
      for (let i = 60; i <= 71; i++) {
        if (drumMachine.isSampleLoaded(i)) {
          loaded.add(i);
        }
      }
      setLoadedSamples(loaded);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handlePadClick = (midiNote: number) => {
    drumMachine.play(midiNote, 100);
  };

  const pads = [];
  for (let i = 60; i <= 71; i++) {
    const sample = drumMachine.getSampleInfo(i);
    if (sample) {
      pads.push({
        midiNote: i,
        name: sample.name,
        key: sample.key,
        isLoaded: loadedSamples.has(i),
        isActive: activeNotes.has(i)
      });
    }
  }

  return (
    <div className="drum-pads">
      <h3>Drum Machine</h3>
      <div className="pads-grid">
        {pads.map((pad, index) => (
          <button
            key={pad.midiNote}
            className={`drum-pad ${pad.isActive ? 'active' : ''} ${!pad.isLoaded ? 'loading' : ''}`}
            style={{ 
              backgroundColor: pad.isActive ? PAD_COLORS[index] : '#2a2a2a',
              borderColor: PAD_COLORS[index]
            }}
            onClick={() => handlePadClick(pad.midiNote)}
            disabled={!pad.isLoaded}
          >
            <span className="pad-key">{pad.key}</span>
            <span className="pad-name">{pad.name}</span>
            {!pad.isLoaded && <span className="pad-loading">Loading...</span>}
          </button>
        ))}
      </div>
    </div>
  );
}