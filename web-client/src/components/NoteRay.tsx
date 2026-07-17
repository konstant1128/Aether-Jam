import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NoteRayProps {
  activeNotes: Set<number>;
  peers: Array<{
    connectionId: string;
    displayName: string;
    instrument: string;
  }>;
}

export function NoteRay({ activeNotes, peers }: NoteRayProps) {
  const linesRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  // Создаем линии между участниками
  const lines = useMemo(() => {
    if (peers.length < 2) return [];
    
    const result = [];
    for (let i = 0; i < peers.length; i++) {
      for (let j = i + 1; j < peers.length; j++) {
        result.push({
          start: new THREE.Vector3(
            Math.cos((i / peers.length) * Math.PI * 2) * 4,
            0,
            Math.sin((i / peers.length) * Math.PI * 2) * 4
          ),
          end: new THREE.Vector3(
            Math.cos((j / peers.length) * Math.PI * 2) * 4,
            0,
            Math.sin((j / peers.length) * Math.PI * 2) * 4
          ),
          key: `${i}-${j}`
        });
      }
    }
    return result;
  }, [peers]);

  useFrame((_, delta) => {
    time.current += delta;
    
    if (linesRef.current) {
      linesRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Line) {
          const material = child.material as THREE.LineBasicMaterial;
          // Пульсация прозрачности в зависимости от активных нот
          const opacity = 0.3 + Math.sin(time.current * 3 + index) * 0.2 + (activeNotes.size * 0.1);
          material.opacity = Math.min(opacity, 1);
        }
      });
    }
  });

  return (
    <group ref={linesRef}>
  {lines.map((line) => (
    <line key={line.key}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[
            new Float32Array([
              line.start.x, line.start.y, line.start.z,
              line.end.x, line.end.y, line.end.z
            ]),
            3 // itemSize
          ]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#4a90e2"
        transparent
        opacity={0.5}
        linewidth={2} // не работает в WebGL, но оставляем
      />
    </line>
  ))}
</group>
  );
}