import { useRef, useState, useCallback, useEffect } from 'react';

interface KnobProps {
  label: string;
  value: number; // 0-100
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  color?: string;
  size?: number;
}

export function Knob({ 
  label, 
  value, 
  min = 0, 
  max = 100, 
  step = 1, 
  onChange, 
  color = '#4a90e2',
  size = 80 
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const normalizedValue = (value - min) / (max - min);
  
  //угол поворота: от -135° до +135° (всего 270°)
  const angle = -135 + normalizedValue * 270;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
  }, [value]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY;
      const sensitivity = (max - min) / 200; // Чувствительность
      const newValue = Math.round(
        Math.max(min, Math.min(max, startValue.current + deltaY * sensitivity)) / step
      ) * step;
      
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  const handleDoubleClick = () => {
    //сброс к значению по умолчанию (50%)
    onChange((min + max) / 2);
  };

  return (
    <div className="knob-container">
      <div
        ref={knobRef}
        className={`knob ${isDragging ? 'dragging' : ''}`}
        style={{ 
          width: size, 
          height: size,
          transform: `rotate(${angle}deg)`
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="knob-indicator" style={{ backgroundColor: color }} />
        <div className="knob-center" />
      </div>
      <div className="knob-label">{label}</div>
      <div className="knob-value" style={{ color }}>
        {Math.round(value)}
      </div>
    </div>
  );
}