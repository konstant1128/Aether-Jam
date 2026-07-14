import { useEffect } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { useStore } from '../store/useStore';
import { peerManager } from '../network/PeerManager';

const KEY_MAP: Record<string, number> = {
  'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64,
  'f': 65, 't': 66, 'g': 67, 'y': 68, 'h': 69,
  'u': 70, 'j': 71, 'k': 72,
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
        // Отправляем ноту всем пирам
        peerManager.broadcastNote('note_on', midiNote, 100);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const midiNote = KEY_MAP[key];
      
      if (midiNote !== undefined) {
        audioEngine.noteOff(midiNote);
        removeActiveNote(midiNote);
        peerManager.broadcastNote('note_off', midiNote, 100);
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