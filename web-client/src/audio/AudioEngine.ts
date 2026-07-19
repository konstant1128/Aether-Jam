import { INSTRUMENT_PRESETS, type InstrumentName } from './Presets';
import { drumMachine } from './DrumMAchine';

interface ActiveVoice {
  oscillator: OscillatorNode | AudioBufferSourceNode;
  gainNode: GainNode;
  filter?: BiquadFilterNode;
  preset: typeof INSTRUMENT_PRESETS.synth;
}

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices = new Map<number, ActiveVoice>();
  private currentInstrument: InstrumentName = 'synth';
  private drumsInitialized = false;

  init() {
    if (this.audioContext) return;
    
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.audioContext.destination);

    // Инициализируем драм-машину
    drumMachine.init(this.audioContext, this.masterGain);
    this.initializeDrums();
  }

  private async initializeDrums() {
    if (this.drumsInitialized) return;
    await drumMachine.loadSamples();
    this.drumsInitialized = true;
  }

  setInstrument(instrument: InstrumentName) {
    this.currentInstrument = instrument;
    console.log('Instrument changed to:', instrument);
  }

  getCurrentInstrument(): InstrumentName {
    return this.currentInstrument;
  }

  noteOn(midiNote: number, velocity: number = 100) {
    if (!this.audioContext || !this.masterGain) this.init();
    if (this.audioContext!.state === 'suspended') this.audioContext!.resume();

    this.noteOff(midiNote);

    const preset = INSTRUMENT_PRESETS[this.currentInstrument];

    // Если выбран инструмент drums, используем семплы
    if (preset.type === 'drums') {
      drumMachine.play(midiNote, velocity);
      return;
    }

    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const frequency = this.midiToFrequency(midiNote + preset.transpose);
    const velocityGain = velocity / 127;

    // Осциллятор
    const oscillator = ctx.createOscillator();
    oscillator.type = preset.oscillatorType;
    oscillator.frequency.value = frequency;

    // Огибающая (ADSR)
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(velocityGain * preset.volume, now + preset.attack);
    envelope.gain.exponentialRampToValueAtTime(
      velocityGain * preset.volume * preset.sustain, 
      now + preset.attack + preset.decay
    );

    // Фильтр
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = preset.filterFrequency;
    filter.Q.value = preset.filterResonance;

    // Соединяем
    oscillator.connect(envelope);
    envelope.connect(filter);
    filter.connect(this.masterGain!);

    oscillator.start(now);

    this.activeVoices.set(midiNote, { oscillator, gainNode: envelope, filter, preset });
  }

  noteOff(midiNote: number) {
    const voice = this.activeVoices.get(midiNote);
    if (!voice || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const releaseTime = voice.preset.release;

    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

    if (voice.oscillator.stop) {
      voice.oscillator.stop(now + releaseTime);
    }
    
    this.activeVoices.delete(midiNote);
  }

  midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }
}

export const audioEngine = new AudioEngine();