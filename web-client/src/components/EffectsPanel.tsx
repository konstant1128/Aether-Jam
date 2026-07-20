import { useState, useEffect } from 'react';
import { Knob } from './Knob';
import { audioEngine } from '../audio/AudioEngine';
import { peerManager } from '../network/PeerManager';

export function EffectsPanel() {
  const [params, setParams] = useState(audioEngine.getEffectsParams());

  useEffect(() => {
    const interval = setInterval(() => {
      setParams(audioEngine.getEffectsParams());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    peerManager.onParamChange((param, value) => {
      audioEngine.applyRemoteParam(param, value);
    });
  }, []);

  const handleParamChange = (param: string, value: number) => {
    // Применяем локально
    switch (param) {
      case 'filterCutoff':
        audioEngine.setFilterCutoff(value);
        break;
      case 'filterResonance':
        audioEngine.setFilterResonance(value);
        break;
      case 'reverbMix':
        audioEngine.setReverbMix(value);
        break;
      case 'delayTime':
        audioEngine.setDelayTime(value);
        break;
      case 'delayFeedback':
        audioEngine.setDelayFeedback(value);
        break;
      case 'distortion':
        audioEngine.setDistortion(value);
        break;
      case 'masterVolume':
        audioEngine.setMasterVolume(value);
        break;
    }
    
    peerManager.broadcastParam(param, value);
  };

  return (
    <div className="effects-panel">
      <h3>Effects & Controls</h3>
      
      <div className="effects-grid">
        {/* Filter */}
        <div className="effect-group">
          <h4>Filter</h4>
          <div className="knobs-row">
            <Knob
              label="Cutoff"
              value={params.filterCutoff}
              onChange={(v) => handleParamChange('filterCutoff', v)}
              color="#4a90e2"
            />
            <Knob
              label="Resonance"
              value={params.filterResonance}
              onChange={(v) => handleParamChange('filterResonance', v)}
              color="#4a90e2"
            />
          </div>
        </div>

        {/* Reverb */}
        <div className="effect-group">
          <h4>Reverb</h4>
          <div className="knobs-row">
            <Knob
              label="Mix"
              value={params.reverbMix}
              onChange={(v) => handleParamChange('reverbMix', v)}
              color="#9b59b6"
            />
          </div>
        </div>

        {/* Delay */}
        <div className="effect-group">
          <h4>Delay</h4>
          <div className="knobs-row">
            <Knob
              label="Time"
              value={params.delayTime}
              onChange={(v) => handleParamChange('delayTime', v)}
              color="#27ae60"
            />
            <Knob
              label="Feedback"
              value={params.delayFeedback}
              onChange={(v) => handleParamChange('delayFeedback', v)}
              color="#27ae60"
            />
          </div>
        </div>

        {/* Distortion */}
        <div className="effect-group">
          <h4>Distortion</h4>
          <div className="knobs-row">
            <Knob
              label="Amount"
              value={params.distortion}
              onChange={(v) => handleParamChange('distortion', v)}
              color="#e94560"
            />
          </div>
        </div>

        {/* Master */}
        <div className="effect-group">
          <h4>Master</h4>
          <div className="knobs-row">
            <Knob
              label="Volume"
              value={params.masterVolume}
              onChange={(v) => handleParamChange('masterVolume', v)}
              color="#f39c12"
              size={90}
            />
          </div>
        </div>
      </div>
    </div>
  );
}