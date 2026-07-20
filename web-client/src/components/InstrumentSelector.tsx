import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../audio/AudioEngine';
import { peerManager } from '../network/PeerManager';
import { INSTRUMENT_PRESETS, type InstrumentName } from '../audio/Presets';

const INSTRUMENT_ICONS: Record<string, string> = {
  synth: '🎹',
  bass: '🎸',
  lead: '🎤',
  pad: '🌊',
  pluck: '🎻',
  keys: '🎼',
  drums: ''
};

export function InstrumentSelector() {
  const { peers, setPeerInstrument } = useStore();

  // Регистрируем колбэк для получения уведомлений об инструментах от других пиров
  useEffect(() => {
    peerManager.onInstrumentChange((connectionId, instrument) => {
      setPeerInstrument(connectionId, instrument);
      console.log(`Peer ${connectionId} changed instrument to ${instrument}`);
    });
  }, [setPeerInstrument]);

  const handleInstrumentChange = (instrument: InstrumentName) => {
    audioEngine.setInstrument(instrument);
    peerManager.broadcastInstrumentChange(instrument);
  };

  return (
    <div className="instrument-selector">
      <h3>Choose Instrument</h3>
      <div className="instrument-grid">
        {Object.entries(INSTRUMENT_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            className={`instrument-button ${audioEngine.getCurrentInstrument() === key ? 'active' : ''}`}
            onClick={() => handleInstrumentChange(key as InstrumentName)}
          >
            <span className="instrument-icon">{INSTRUMENT_ICONS[key]}</span>
            <span className="instrument-name">{preset.name}</span>
          </button>
        ))}
      </div>
      
      {/* Отображение инструментов других пиров */}
      {peers.length > 0 && (
        <div className="peer-instruments">
          <h4>Peers:</h4>
          {peers.map((peer) => (
            <div key={peer.connectionId} className="peer-instrument-item">
              <span>{peer.displayName}</span>
              <span>
                {INSTRUMENT_ICONS[peer.instrument] || '🎹'} {peer.instrument}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}