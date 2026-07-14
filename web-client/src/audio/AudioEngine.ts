interface ActiveVoice {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices = new Map<number, ActiveVoice>(); // Храним активные ноты по MIDI-номеру

  init() {
    if (this.audioContext) return;
    
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3; 
    this.masterGain.connect(this.audioContext.destination);
  }

  //нажатие клавиши
  noteOn(midiNote: number, velocity: number = 100) {
    if (!this.audioContext || !this.masterGain) this.init();
    if (this.audioContext!.state === 'suspended') this.audioContext!.resume();

    //если нота уже играет, глушим её перед запуском новой
    this.noteOff(midiNote);

    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const frequency = this.midiToFrequency(midiNote);
    const velocityGain = velocity / 127; // Нормализуем velocity от 0.0 до 1.0

    //осциллятор (пила)
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = frequency;

    //огибающая (ADSR)
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(velocityGain, now + 0.01); // Attack: 10ms
    envelope.gain.exponentialRampToValueAtTime(velocityGain * 0.6, now + 0.1); // Decay

    //фильтр (Low-Pass)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    //соединяем
    oscillator.connect(envelope);
    envelope.connect(filter);
    filter.connect(this.masterGain!);

    oscillator.start(now);

    //сохраняем голос
    this.activeVoices.set(midiNote, { oscillator, gainNode: envelope });
  }

  //отпускание клавиши
  noteOff(midiNote: number) {
    const voice = this.activeVoices.get(midiNote);
    if (!voice || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const releaseTime = 0.3; // 300ms release

    //плавно убираем громкость до 0
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

    //останавливаем осциллятор после затухания
    voice.oscillator.stop(now + releaseTime);
    
    //удаляем из активных
    this.activeVoices.delete(midiNote);
  }

  midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }
}

export const audioEngine = new AudioEngine();