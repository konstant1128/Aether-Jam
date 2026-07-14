import { useEffect } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { useStore } from '../store/useStore';

const KEY_MAP: Record<string, number> = {
  'a': 60, // C4
  'w': 61, // C#4
  's': 62, // D4
  'e': 63, // D#4
  'd': 64, // E4
  'f': 65, // F4
  't': 66, // F#4
  'g': 67, // G4
  'y': 68, // G#4
  'h': 69, // A4
  'u': 70, // A#4
  'j': 71, // B4
  'k': 72, // C5
};

export function useKeyboard() {
  const { addActiveNote, removeActiveNote } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const midiNote = KEY_MAP[key];
      
      if (midiNote !== undefined) {
        audioEngine.noteOn(midiNote, 100);
        addActiveNote(midiNote);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const midiNote = KEY_MAP[key];
      
      if (midiNote !== undefined) {
        audioEngine.noteOff(midiNote);
        removeActiveNote(midiNote);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [addActiveNote, removeActiveNote]);
}