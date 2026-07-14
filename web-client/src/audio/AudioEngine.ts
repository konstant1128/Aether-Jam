class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  init() {
    if (this.audioContext) return;
    
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3; // Мастер-громкость
    this.masterGain.connect(this.audioContext.destination);
  }

  playNote(frequency: number, duration: number = 0.5) {
    if (!this.audioContext || !this.masterGain) {
      this.init();
    }

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    //осциллятор (пила для более интересного звука)
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = frequency;

    //ADSR огибающая через GainNode
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1, now + 0.01); // Attack: 10ms
    envelope.gain.exponentialRampToValueAtTime(0.6, now + 0.1); // Decay: 100ms to 60%
    envelope.gain.setValueAtTime(0.6, now + duration - 0.3); // Sustain
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release: 300ms

    //фильтр (Low-Pass для мягкости)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    //соединяем: oscillator -> envelope -> filter -> master
    oscillator.connect(envelope);
    envelope.connect(filter);
    filter.connect(this.masterGain!);

    //запускаем и останавливаем
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  //MIDI-нота в частоту
  midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }
}

export const audioEngine = new AudioEngine();