import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ParticipantSphereProps {
  peer: {
    connectionId: string;
    displayName: string;
    instrument: string;
  };
  position: [number, number, number];
}

//палитра цветов для участников
const COLOR_PALETTE = [
  '#4a90e2', // Синий
  '#e94560', // Красный
  '#f39c12', // Оранжевый
  '#27ae60', // Зеленый
  '#9b59b6', // Фиолетовый
  '#1abc9c', // Бирюзовый
  '#e74c3c', // Алый
  '#3498db', // Голубой
];

//генерация цвета на основе connectionId
function getPeerColor(connectionId: string): string {
  //простой хеш для выбора цвета из палитры
  let hash = 0;
  for (let i = 0; i < connectionId.length; i++) {
    const char = connectionId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; //convert to 32bit integer
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

export function ParticipantSphere({ peer, position }: ParticipantSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  
  //вычисляем цвет один раз при монтировании
  const color = useMemo(() => getPeerColor(peer.connectionId), [peer.connectionId]);

  useFrame((_, delta) => {
    time.current += delta;
    if (meshRef.current) {
      const scale = 1 + Math.sin(time.current * 2) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[1, 32, 32]}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      
      <sprite position={[0, -1.5, 0]} scale={[2, 0.5, 1]}>
        <spriteMaterial transparent opacity={0.8}>
          <canvasTexture
            attach="map"
            image={createTextTexture(peer.displayName)}
          />
        </spriteMaterial>
      </sprite>
    </group>
  );
}

function createTextTexture(text: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  return canvas;
}