export interface InstrumentPreset {
  name: string;
  type: 'synth' | 'bass' | 'lead' | 'pad' | 'pluck' | 'keys' | 'drums';
  oscillatorType: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFrequency: number;
  filterResonance: number;
  volume: number;
  transpose: number,
  effects?: {
    reverb?: number;
    delay?: number;
    distortion?: number;
  };
}

export const INSTRUMENT_PRESETS: Record<string, InstrumentPreset> = {
  synth: {
    name: 'Synth',
    type: 'synth',
    oscillatorType: 'sawtooth',
    attack: 0.01,
    decay: 0.1,
    sustain: 0.6,
    release: 0.3,
    filterFrequency: 2000,
    filterResonance: 1,
    volume: 0.3,
    transpose: 0,
    effects: { reverb: 0.2 }
  },
  
  bass: {
    name: 'Bass',
    type: 'bass',
    oscillatorType: 'sawtooth',
    attack: 0.01,
    decay: 0.2,
    sustain: 0.8,
    release: 0.1,
    filterFrequency: 800,
    filterResonance: 3,
    volume: 0.4,
    transpose: -24,
    effects: { distortion: 0.1 }
  },
  
  lead: {
    name: 'Lead',
    type: 'lead',
    oscillatorType: 'square',
    attack: 0.01,
    decay: 0.15,
    sustain: 0.7,
    release: 0.2,
    filterFrequency: 3000,
    filterResonance: 2,
    volume: 0.35,
    transpose: 12,
    effects: { reverb: 0.3, delay: 0.2 }
  },
  
  pad: {
    name: 'Pad',
    type: 'pad',
    oscillatorType: 'sine',
    attack: 0.5,
    decay: 0.3,
    sustain: 0.9,
    release: 1.0,
    filterFrequency: 1500,
    filterResonance: 0.5,
    volume: 0.25,
    transpose: 0,
    effects: { reverb: 0.5 }
  },
  
  pluck: {
    name: 'Pluck',
    type: 'pluck',
    oscillatorType: 'triangle',
    attack: 0.001,
    decay: 0.2,
    sustain: 0.0,
    release: 0.1,
    filterFrequency: 4000,
    filterResonance: 1,
    volume: 0.35,
    transpose: 0,
    effects: { delay: 0.15 }
  },
  
  keys: {
    name: 'Keys',
    type: 'keys',
    oscillatorType: 'sine',
    attack: 0.01,
    decay: 0.3,
    sustain: 0.4,
    release: 0.4,
    filterFrequency: 2500,
    filterResonance: 0.8,
    volume: 0.3,
    transpose: 0,
    effects: { reverb: 0.25 }
  },
  
  drums: {
    name: 'Drums',
    type: 'drums',
    oscillatorType: 'square',
    attack: 0.001,
    decay: 0.1,
    sustain: 0.0,
    release: 0.05,
    filterFrequency: 5000,
    filterResonance: 0,
    volume: 0.5,
    transpose: 0,
    effects: { distortion: 0.2 }
  }
};

export type InstrumentName = keyof typeof INSTRUMENT_PRESETS;