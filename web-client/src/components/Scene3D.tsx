
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { ParticipantSphere } from './ParticipantSphere';
import { NoteRay } from './NoteRay';
import { useStore } from '../store/useStore';

export function Scene3D() {
  const { peers, activeNotes } = useStore();

  return (
    <div className="scene-container">
      <Canvas
        camera={{ position: [0, 5, 10], fov: 60 }}
        style={{ background: '#0a0a0f' }}
      >
        {/* Освещение */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#4a90e2" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#e94560" />

        {/* Звездное небо */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Сферы участников */}
        {peers.map((peer, index) => (
          <ParticipantSphere
            key={peer.connectionId}
            peer={peer}
            position={[
              Math.cos((index / peers.length) * Math.PI * 2) * 4,
              0,
              Math.sin((index / peers.length) * Math.PI * 2) * 4
            ]}
          />
        ))}

        {/* Лучи нот (пока заглушка) */}
        {activeNotes.size > 0 && peers.length > 1 && (
          <NoteRay activeNotes={activeNotes} peers={peers} />
        )}

        {/* Управление камерой */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Оверлей с информацией */}
      <div className="scene-overlay">
        <div className="overlay-info">
          <span className="info-label">Participants</span>
          <span className="info-value">{peers.length}</span>
        </div>
        <div className="overlay-info">
          <span className="info-label">Active Notes</span>
          <span className="info-value">{activeNotes.size}</span>
        </div>
      </div>
    </div>
  );
}