import { useStore } from '../store/useStore';

interface PianoKey {
  midi: number;
  note: string;
  type: 'white' | 'black';
  key: string;
  position?: number;
}

const KEYS: PianoKey[] = [
  { midi: 60, note: 'C', type: 'white', key: 'A' },
  { midi: 61, note: 'C#', type: 'black', key: 'W', position: 0 },
  { midi: 62, note: 'D', type: 'white', key: 'S' },
  { midi: 63, note: 'D#', type: 'black', key: 'E', position: 1 },
  { midi: 64, note: 'E', type: 'white', key: 'D' },
  { midi: 65, note: 'F', type: 'white', key: 'F' },
  { midi: 66, note: 'F#', type: 'black', key: 'T', position: 3 },
  { midi: 67, note: 'G', type: 'white', key: 'G' },
  { midi: 68, note: 'G#', type: 'black', key: 'Y', position: 4 },
  { midi: 69, note: 'A', type: 'white', key: 'H' },
  { midi: 70, note: 'A#', type: 'black', key: 'U', position: 5 },
  { midi: 71, note: 'B', type: 'white', key: 'J' },
  { midi: 72, note: 'C', type: 'white', key: 'K' },
];

export function PianoKeyboard() {
  const { activeNotes } = useStore();

  // Отделяем белые клавиши
  const whiteKeys = KEYS.filter(k => k.type === 'white');
  // Создаём словарь: position → чёрная клавиша
  const blackMap = new Map<number, PianoKey>();
  KEYS.filter(k => k.type === 'black').forEach(k => {
    if (k.position !== undefined) blackMap.set(k.position, k);
  });

  return (
    <div className="piano-keyboard">
      {whiteKeys.map((whiteKey, index) => {
        const isActive = activeNotes.has(whiteKey.midi);
        // Проверяем, есть ли чёрная для этой позиции
        const blackKey = blackMap.get(index);
        const isBlackActive = blackKey ? activeNotes.has(blackKey.midi) : false;

        return (
          <div
            key={whiteKey.midi}
            className={`piano-key white ${isActive ? 'active' : ''}`}
          >
            <span className="key-label">{whiteKey.key}</span>
            <span className="note-label">{whiteKey.note}</span>

            {/* Рендерим чёрную клавишу внутри белой, если она есть */}
            {blackKey && (
              <div
                className={`piano-key black ${isBlackActive ? 'active' : ''}`}
              >
                <span className="key-label">{blackKey.key}</span>
                <span className="note-label">{blackKey.note}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}