import { useStore } from '../store/useStore';
import { audioEngine } from '../audio/AudioEngine';
import { INSTRUMENT_PRESETS, type InstrumentName } from '../audio/Presets';

const INSTRUMENT_ICONS: Record<string, string> = {
  synth: '',
  bass: '',
  lead: '',
  pad: '',
  pluck: '',
  keys: '',
  drums: ''
};

export function InstrumentSelector() {
  const { peers } = useStore();

  const handleInstrumentChange = (instrument: InstrumentName) => {
    audioEngine.setInstrument(instrument);
    //в будущем: отправить всем пирам информацию о смене инструмента
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
    </div>
  );
}