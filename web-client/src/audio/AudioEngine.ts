import { INSTRUMENT_PRESETS, type InstrumentName } from './Presets';
import { drumMachine } from './DrumMachine';

interface ActiveVoice {
  oscillator: OscillatorNode | AudioBufferSourceNode;
  gainNode: GainNode;
  preset: typeof INSTRUMENT_PRESETS.synth;
  isPlaying: boolean; // Добавили флаг
}

interface EffectsParams {
  filterCutoff: number;
  filterResonance: number;
  reverbMix: number;
  delayTime: number;
  delayFeedback: number;
  distortion: number;
  masterVolume: number;
}

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices = new Map<number, ActiveVoice>();
  private currentInstrument: InstrumentName = 'synth';
  private drumsInitialized = false;
  private isInitialized = false;
  
  // Эффекты
  private filterNode: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackNode: GainNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  
  private effectsParams: EffectsParams = {
    filterCutoff: 75,
    filterResonance: 10,
    reverbMix: 20,
    delayTime: 30,
    delayFeedback: 30,
    distortion: 0,
    masterVolume: 70
  };

  init() {
    if (this.isInitialized) return;
    
    console.log('Initializing AudioEngine...');
    this.audioContext = new AudioContext();
    
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.effectsParams.masterVolume / 100;
    
    this.setupEffects();
    
    this.masterGain.connect(this.audioContext.destination);
    
    console.log('AudioEngine initialized');

    drumMachine.init(this.audioContext, this.masterGain);
    this.initializeDrums();
    
    this.isInitialized = true;
  }

  private setupEffects() {
    if (!this.audioContext || !this.masterGain) return;

    // Фильтр
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.updateFilter();

    // Дисторшн
    this.distortionNode = this.audioContext.createWaveShaper();
    this.distortionNode.curve = this.makeDistortionCurve(0) as Float32Array<ArrayBuffer>;
    this.distortionNode.oversample = '4x';

    // Реверберация
    this.reverbNode = this.audioContext.createConvolver();
    this.reverbNode.buffer = this.createReverbImpulse(2, 2);
    
    this.reverbGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.updateReverb();

    // Задержка
    this.delayNode = this.audioContext.createDelay(2);
    this.delayFeedbackNode = this.audioContext.createGain();
    this.updateDelay();

    // Цепочка
    this.filterNode.connect(this.distortionNode);
    this.distortionNode.connect(this.dryGain);
    this.dryGain.connect(this.masterGain);
    
    this.distortionNode.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
    
    this.distortionNode.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedbackNode);
    this.delayFeedbackNode.connect(this.delayNode);
    this.delayNode.connect(this.masterGain);
  }

  private createReverbImpulse(duration: number, decay: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    return impulse;
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    return curve;
  }

  setFilterCutoff(value: number) {
    this.effectsParams.filterCutoff = value;
    this.updateFilter();
  }

  setFilterResonance(value: number) {
    this.effectsParams.filterResonance = value;
    this.updateFilter();
  }

  setReverbMix(value: number) {
    this.effectsParams.reverbMix = value;
    this.updateReverb();
  }

  setDelayTime(value: number) {
    this.effectsParams.delayTime = value;
    this.updateDelay();
  }

  setDelayFeedback(value: number) {
    this.effectsParams.delayFeedback = value;
    this.updateDelay();
  }

  setDistortion(value: number) {
    this.effectsParams.distortion = value;
    if (this.distortionNode) {
      this.distortionNode.curve = this.makeDistortionCurve(value) as Float32Array<ArrayBuffer>;
    }
  }

  setMasterVolume(value: number) {
    this.effectsParams.masterVolume = value;
    if (this.masterGain) {
      this.masterGain.gain.value = value / 100;
    }
  }

  getEffectsParams(): EffectsParams {
    return { ...this.effectsParams };
  }

  private updateFilter() {
    if (!this.filterNode) return;
    
    const minFreq = 20;
    const maxFreq = 20000;
    const frequency = minFreq * Math.pow(maxFreq / minFreq, this.effectsParams.filterCutoff / 100);
    
    this.filterNode.frequency.value = frequency;
    this.filterNode.Q.value = this.effectsParams.filterResonance / 5;
  }

  private updateReverb() {
    if (!this.reverbGain || !this.dryGain) return;
    
    const mix = this.effectsParams.reverbMix / 100;
    this.reverbGain.gain.value = mix;
    this.dryGain.gain.value = 1 - mix * 0.5;
  }

  private updateDelay() {
    if (!this.delayNode || !this.delayFeedbackNode) return;
    
    const time = (this.effectsParams.delayTime / 100) * 1;
    this.delayNode.delayTime.value = time;
    this.delayFeedbackNode.gain.value = this.effectsParams.delayFeedback / 100 * 0.9;
  }

  private async initializeDrums() {
    if (this.drumsInitialized) return;
    await drumMachine.loadSamples();
    this.drumsInitialized = true;
  }

  setInstrument(instrument: InstrumentName) {
    this.currentInstrument = instrument;
  }

  getCurrentInstrument(): InstrumentName {
    return this.currentInstrument;
  }

  noteOn(midiNote: number, velocity: number = 100) {
    // Инициализируем при первом вызове
    if (!this.isInitialized) {
      this.init();
    }
    
    if (!this.audioContext || !this.masterGain || !this.filterNode) {
      console.error('AudioEngine not properly initialized');
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Сначала останавливаем предыдущую ноту, если она есть
    this.noteOff(midiNote);

    const preset = INSTRUMENT_PRESETS[this.currentInstrument];

    // Для drums используем семплы
    if (preset.type === 'drums') {
      drumMachine.play(midiNote, velocity);
      return;
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const frequency = this.midiToFrequency(midiNote + preset.transpose);
    const velocityGain = velocity / 127;

    // Осциллятор
    const oscillator = ctx.createOscillator();
    oscillator.type = preset.oscillatorType;
    oscillator.frequency.value = frequency;

    // Огибающая
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(velocityGain * preset.volume, now + preset.attack);
    envelope.gain.exponentialRampToValueAtTime(
      velocityGain * preset.volume * preset.sustain, 
      now + preset.attack + preset.decay
    );

    // Подключаем
    oscillator.connect(envelope);
    envelope.connect(this.filterNode);

    // Запускаем
    oscillator.start(now);

    // Сохраняем с флагом isPlaying = true
    this.activeVoices.set(midiNote, { 
      oscillator, 
      gainNode: envelope, 
      preset,
      isPlaying: true 
    });
  }

  noteOff(midiNote: number) {
    const voice = this.activeVoices.get(midiNote);
    if (!voice || !this.audioContext) return;

    // Проверяем, что осциллятор действительно играет
    if (!voice.isPlaying) return;

    const now = this.audioContext.currentTime;
    const releaseTime = voice.preset.release;

    // Плавное затухание
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

    // Останавливаем осциллятор только если он был запущен
    try {
      voice.oscillator.stop(now + releaseTime);
    } catch (e) {
      console.warn('Failed to stop oscillator:', e);
    }
    
    // Удаляем из активных
    this.activeVoices.delete(midiNote);
  }

  midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  // Применение удаленного параметра (без отправки обратно в сеть)
  applyRemoteParam(param: string, value: number) {
    console.log(`Applying remote param: ${param} = ${value}`);
    
    switch (param) {
      case 'filterCutoff':
        this.effectsParams.filterCutoff = value;
        this.updateFilter();
        break;
      case 'filterResonance':
        this.effectsParams.filterResonance = value;
        this.updateFilter();
        break;
      case 'reverbMix':
        this.effectsParams.reverbMix = value;
        this.updateReverb();
        break;
      case 'delayTime':
        this.effectsParams.delayTime = value;
        this.updateDelay();
        break;
      case 'delayFeedback':
        this.effectsParams.delayFeedback = value;
        this.updateDelay();
        break;
      case 'distortion':
        this.effectsParams.distortion = value;
        if (this.distortionNode) {
          this.distortionNode.curve = this.makeDistortionCurve(value) as Float32Array<ArrayBuffer>;
        }
        break;
      case 'masterVolume':
        this.effectsParams.masterVolume = value;
        if (this.masterGain) {
          this.masterGain.gain.value = value / 100;
        }
        break;
    }
  }
}

export const audioEngine = new AudioEngine();