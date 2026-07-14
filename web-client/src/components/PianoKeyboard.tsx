import { useStore } from '../store/useStore';

const KEYS = [
  { midi: 60, note: 'C', type: 'white', key: 'A' },
  { midi: 61, note: 'C#', type: 'black', key: 'W' },
  { midi: 62, note: 'D', type: 'white', key: 'S' },
  { midi: 63, note: 'D#', type: 'black', key: 'E' },
  { midi: 64, note: 'E', type: 'white', key: 'D' },
  { midi: 65, note: 'F', type: 'white', key: 'F' },
  { midi: 66, note: 'F#', type: 'black', key: 'T' },
  { midi: 67, note: 'G', type: 'white', key: 'G' },
  { midi: 68, note: 'G#', type: 'black', key: 'Y' },
  { midi: 69, note: 'A', type: 'white', key: 'H' },
  { midi: 70, note: 'A#', type: 'black', key: 'U' },
  { midi: 71, note: 'B', type: 'white', key: 'J' },
  { midi: 72, note: 'C', type: 'white', key: 'K' },
];

export function PianoKeyboard() {
  const { activeNotes } = useStore();

  return (
    <div className="piano-keyboard">
      {KEYS.map((key) => {
        const isActive = activeNotes.has(key.midi);
        const isBlack = key.type === 'black';

        return (
          <div
            key={key.midi}
            className={`piano-key ${key.type} ${isActive ? 'active' : ''}`}
            style={isBlack ? { left: `${(KEYS.indexOf(key) - 0.5) * 40}px` } : {}}
          >
            <span className="key-label">{key.key}</span>
            <span className="note-label">{key.note}</span>
          </div>
        );
      })}
    </div>
  );
}