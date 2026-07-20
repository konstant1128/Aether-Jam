export interface DrumSample {
  name: string;
  key: string; // Клавиша (C, C#, D, и т.д.)
  midiNote: number;
  buffer: AudioBuffer | null;
  url: string; // Путь к семплу
}

export class DrumMachine {
  private audioContext: AudioContext | null = null;
  private samples = new Map<number, DrumSample>();
  private masterGain: GainNode | null = null;
  private isLoaded = false;

  private drumMapping: Record<number, { name: string; key: string; url: string }> = {
    60: { name: 'Kick', key: 'A', url: '/samples/kick.wav' },
    61: { name: 'Snare', key: 'W', url: '/samples/snare.wav' },
    62: { name: 'Hi-Hat Closed', key: 'S', url: '/samples/hihat_closed.wav' },
    63: { name: 'Hi-Hat Open', key: 'E', url: '/samples/hihat_open.wav' },
    64: { name: 'Clap', key: 'D', url: '/samples/clap.wav' },
    65: { name: 'Tom Low', key: 'F', url: '/samples/tom_low.wav' },
    66: { name: 'Tom Mid', key: 'T', url: '/samples/tom_mid.wav' },
    67: { name: 'Tom High', key: 'G', url: '/samples/tom_high.wav' },
    68: { name: 'Crash', key: 'Y', url: '/samples/crash.wav' },
    69: { name: 'Ride', key: 'H', url: '/samples/ride.wav' },
    70: { name: 'Percussion 1', key: 'U', url: '/samples/perc1.wav' },
    71: { name: 'Percussion 2', key: 'J', url: '/samples/perc2.wav' },
  };

  init(audioContext: AudioContext, masterGain: GainNode) {
    this.audioContext = audioContext;
    this.masterGain = masterGain;
  }

  async loadSamples() {
    if (!this.audioContext) return;

    const loadPromises = Object.entries(this.drumMapping).map(async ([midiNote, info]) => {
      try {
        const response = await fetch(info.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        
        this.samples.set(parseInt(midiNote), {
          name: info.name,
          key: info.key,
          midiNote: parseInt(midiNote),
          buffer: audioBuffer,
          url: info.url
        });
      } catch (error) {
        console.warn(`Failed to load sample: ${info.url}`, error);
      }
    });

    await Promise.all(loadPromises);
    this.isLoaded = true;
    console.log('Drum samples loaded:', this.samples.size);
  }

  play(midiNote: number, velocity: number = 100) {
    if (!this.audioContext || !this.masterGain) return;

    const sample = this.samples.get(midiNote);
    if (!sample || !sample.buffer) {
      console.warn(`No sample loaded for MIDI note ${midiNote}`);
      return;
    }

    const now = this.audioContext.currentTime;
    const velocityGain = velocity / 127;

    //создаем источник звука
    const source = this.audioContext.createBufferSource();
    source.buffer = sample.buffer;

    //громкость
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = velocityGain;

    //соединяем
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    //воспроизводим
    source.start(now);

    //автоматическая очистка после воспроизведения
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  }

  isSampleLoaded(midiNote: number): boolean {
    const sample = this.samples.get(midiNote);
    return sample !== undefined && sample.buffer !== null;
  }

  getSampleInfo(midiNote: number): DrumSample | undefined {
    return this.samples.get(midiNote);
  }

  getAllSamples(): DrumSample[] {
    return Array.from(this.samples.values());
  }

  getIsLoaded(): boolean {
    return this.isLoaded;
  }
}

export const drumMachine = new DrumMachine();