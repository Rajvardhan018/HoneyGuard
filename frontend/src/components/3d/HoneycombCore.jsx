import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Beveled Hexagonal Honeycomb Prism
function HexagonCell({ position, rotation, scale = 1, color = "#a78bfa", opacity = 0.85, thickness = 0.35 }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <cylinderGeometry args={[1, 1, thickness, 6]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.12}
        metalness={0.15}
        transmission={0.7}
        thickness={1.4}
        transparent={true}
        opacity={opacity}
        reflectivity={0.9}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}

// Faceted HG Monogram Center Core
function HGEmblemCore() {
  const groupRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.25 + t * 0.1;
      groupRef.current.rotation.x = Math.cos(t * 0.25) * 0.08;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.25;
      ring1Ref.current.rotation.x = t * 0.12;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.2;
      ring2Ref.current.rotation.z = t * 0.15;
    }
  });

  // Honeycomb satellite layout
  const satellites = useMemo(() => [
    { pos: [0, 0, 0], scale: 1.45, color: "#7c3aed", opacity: 0.9, thick: 0.4 },
    { pos: [1.9, 0, 0], scale: 0.85, color: "#8b5cf6", opacity: 0.75, thick: 0.3 },
    { pos: [-1.9, 0, 0], scale: 0.85, color: "#8b5cf6", opacity: 0.75, thick: 0.3 },
    { pos: [0.95, 1.65, 0], scale: 0.85, color: "#a78bfa", opacity: 0.75, thick: 0.3 },
    { pos: [-0.95, 1.65, 0], scale: 0.85, color: "#a78bfa", opacity: 0.75, thick: 0.3 },
    { pos: [0.95, -1.65, 0], scale: 0.85, color: "#a78bfa", opacity: 0.75, thick: 0.3 },
    { pos: [-0.95, -1.65, 0], scale: 0.85, color: "#a78bfa", opacity: 0.75, thick: 0.3 },
    // Foreground / background depth cells
    { pos: [0, 0, 0.65], scale: 0.6, color: "#ddd6fe", opacity: 0.85, thick: 0.25 },
    { pos: [0, 0, -0.65], scale: 0.6, color: "#6d28d9", opacity: 0.85, thick: 0.25 },
  ], []);

  return (
    <group ref={groupRef}>
      {/* Honeycomb Cluster */}
      {satellites.map((tile, i) => (
        <HexagonCell
          key={i}
          position={tile.pos}
          rotation={[Math.PI / 2, 0, 0]}
          scale={tile.scale}
          color={tile.color}
          opacity={tile.opacity}
          thickness={tile.thick}
        />
      ))}

      {/* Central HG Monogram geometric core structure */}
      <group position={[0, 0, 0.4]}>
        {/* Left 'H' Vertical Bar */}
        <mesh position={[-0.45, 0, 0.3]}>
          <boxGeometry args={[0.22, 1.2, 0.22]} />
          <meshPhysicalMaterial
            color="#ffffff"
            emissive="#a78bfa"
            emissiveIntensity={0.5}
            transmission={0.4}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>
        {/* Right 'H/G' Vertical Bar */}
        <mesh position={[0.45, 0.15, 0.3]}>
          <boxGeometry args={[0.22, 0.9, 0.22]} />
          <meshPhysicalMaterial
            color="#ffffff"
            emissive="#a78bfa"
            emissiveIntensity={0.5}
            transmission={0.4}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>
        {/* Center Crossbar connecting H */}
        <mesh position={[0, 0.05, 0.3]}>
          <boxGeometry args={[0.7, 0.2, 0.22]} />
          <meshPhysicalMaterial
            color="#ffffff"
            emissive="#c4b5fd"
            emissiveIntensity={0.6}
            transmission={0.4}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>
        {/* Lower Inward 'G' Hook */}
        <mesh position={[0.25, -0.45, 0.3]}>
          <boxGeometry args={[0.62, 0.2, 0.22]} />
          <meshPhysicalMaterial
            color="#ffffff"
            emissive="#a78bfa"
            emissiveIntensity={0.5}
            transmission={0.4}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>
      </group>

      {/* Gyroscopic Gimbal Orbit Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[3.1, 0.035, 16, 100]} />
        <meshStandardMaterial
          color="#c4b5fd"
          metalness={0.85}
          roughness={0.15}
          transparent
          opacity={0.65}
        />
      </mesh>

      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.45, 0.028, 16, 100]} />
        <meshStandardMaterial
          color="#8b5cf6"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.5}
        />
      </mesh>

      <Sparkles count={45} scale={6.5} size={3.2} speed={0.45} color="#8b5cf6" />
    </group>
  );
}

export default function HoneycombCore({ className = "h-[460px] w-full" }) {
  const [hasWebGL, setHasWebGL] = useState(true);

  return (
    <div className={`relative ${className} flex items-center justify-center select-none`}>
      {hasWebGL ? (
        <Canvas
          onError={() => setHasWebGL(false)}
          gl={{ antialias: true, alpha: true }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 7.8]} fov={45} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[5, 8, 5]} intensity={2.0} color="#ffffff" />
          <pointLight position={[-5, -4, -2]} intensity={2.5} color="#8b5cf6" />
          <pointLight position={[4, -3, 3]} intensity={1.8} color="#c4b5fd" />

          <Float speed={2} rotationIntensity={0.4} floatIntensity={0.7}>
            <HGEmblemCore />
          </Float>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 1.7}
            minPolarAngle={Math.PI / 2.3}
          />
        </Canvas>
      ) : (
        <div className="flex flex-col items-center justify-center p-8">
          <img
            src="/assets/logo.png"
            alt="HoneyGuard 3D Core"
            className="w-56 h-56 object-contain drop-shadow-2xl animate-pulse"
          />
        </div>
      )}
      <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center">
        <div className="w-80 h-80 rounded-full bg-purple-400/25 blur-3xl" />
      </div>
    </div>
  );
}
