import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Float } from '@react-three/drei';
import * as THREE from 'three';

// Individual Rackmount Server Blade
function ServerBlade({ y = 0, isSSH = true, deceptionLevel = "HIGH", unitIndex = 0 }) {
  const ledRef1 = useRef();
  const ledRef2 = useRef();
  const ledRef3 = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // LED blinking telemetry
    if (ledRef1.current) {
      const flicker = Math.sin(t * 12 + unitIndex * 3) * Math.cos(t * 7);
      ledRef1.current.material.opacity = flicker > 0 ? 0.95 : 0.2;
    }
    if (ledRef2.current) {
      const pulse = Math.sin(t * 18 + unitIndex * 2);
      ledRef2.current.material.opacity = pulse > 0.2 ? 0.9 : 0.15;
    }
    if (ledRef3.current) {
      const strobeRate = deceptionLevel === 'CRITICAL' ? 10 : deceptionLevel === 'HIGH' ? 6 : 2;
      const strobe = Math.sin(t * strobeRate) > 0.3;
      ledRef3.current.material.opacity = strobe ? 1.0 : 0.25;
    }
  });

  const accentColor = isSSH ? "#6366f1" : "#a855f7";
  const alertColor = deceptionLevel === 'CRITICAL' ? '#ef4444' : deceptionLevel === 'HIGH' ? '#f59e0b' : '#8b5cf6';

  return (
    <group position={[0, y, 0]}>
      {/* 1. Main Chassis Box (Gunmetal / Dark Indigo Brushed Aluminum) */}
      <mesh>
        <boxGeometry args={[1.5, 0.26, 1.2]} />
        <meshStandardMaterial
          color="#1e1338"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* 2. Top Edge Bevel Accent Trim */}
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[1.52, 0.015, 1.22]} />
        <meshStandardMaterial color="#4c1d95" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 3. Front Bezel Faceplate (Recessed dark acrylic) */}
      <mesh position={[0, 0, 0.605]}>
        <boxGeometry args={[1.44, 0.22, 0.02]} />
        <meshPhysicalMaterial
          color="#0f0721"
          roughness={0.15}
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* 4. Left Rack Mount Ear */}
      <mesh position={[-0.78, 0, 0.58]}>
        <boxGeometry args={[0.06, 0.24, 0.06]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Right Rack Mount Ear */}
      <mesh position={[0.78, 0, 0.58]}>
        <boxGeometry args={[0.06, 0.24, 0.06]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 5. Cooling Ventilation Slots (Left & Center) */}
      {[-0.28, -0.18, -0.08].map((xOffset, idx) => (
        <mesh key={idx} position={[xOffset, 0, 0.616]}>
          <boxGeometry args={[0.06, 0.14, 0.01]} />
          <meshBasicMaterial color="#05020a" />
        </mesh>
      ))}

      {/* 6. Protocol Badge Plate */}
      <mesh position={[0.2, 0, 0.616]}>
        <boxGeometry args={[0.34, 0.12, 0.01]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} />
      </mesh>

      {/* 7. LED Array (Right side of faceplate) */}
      {/* Power LED (Solid Emerald) */}
      <mesh position={[0.55, 0.04, 0.618]}>
        <boxGeometry args={[0.025, 0.025, 0.01]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Disk/Activity LED (Amber Flickering) */}
      <mesh ref={ledRef1} position={[0.60, 0.04, 0.618]}>
        <boxGeometry args={[0.025, 0.025, 0.01]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} />
      </mesh>

      {/* Network Traffic LED (Cyan/Blue Pulse) */}
      <mesh ref={ledRef2} position={[0.55, -0.04, 0.618]}>
        <boxGeometry args={[0.025, 0.025, 0.01]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>

      {/* Honeypot Status/Alert LED (Purple/Red Alert) */}
      <mesh ref={ledRef3} position={[0.60, -0.04, 0.618]}>
        <boxGeometry args={[0.025, 0.025, 0.01]} />
        <meshBasicMaterial color={alertColor} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

// Enterprise Cybersecurity Honeypot Appliance
function HoneypotServerAppliance({ type = "SSH", deceptionLevel = "HIGH" }) {
  const stackRef = useRef();
  const holoRingsRef = useRef();
  const holoDiscRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (stackRef.current) {
      stackRef.current.rotation.y = Math.PI / 4.2 + Math.sin(t * 0.4) * 0.12;
      stackRef.current.position.y = Math.sin(t * 1.2) * 0.04;
    }
    if (holoRingsRef.current) {
      holoRingsRef.current.rotation.z = t * 0.5;
    }
    if (holoDiscRef.current) {
      holoDiscRef.current.rotation.z = -t * 0.3;
    }
  });

  const isSSH = type.toUpperCase().includes("SSH");
  const baseHoloColor = deceptionLevel === 'CRITICAL' ? "#ef4444" :
                        deceptionLevel === 'HIGH' ? "#8b5cf6" :
                        deceptionLevel === 'MEDIUM' ? "#6366f1" : "#10b981";

  return (
    <group ref={stackRef} rotation={[0.3, Math.PI / 4.2, 0]}>
      {/* Dual Stack Server Appliance (Unit 1 & Unit 2) */}
      <ServerBlade y={0.16} isSSH={isSSH} deceptionLevel={deceptionLevel} unitIndex={0} />
      <ServerBlade y={-0.16} isSSH={isSSH} deceptionLevel={deceptionLevel} unitIndex={1} />

      {/* Holographic Projection Platform Base beneath appliance */}
      <group position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Outer Ring */}
        <mesh ref={holoRingsRef}>
          <ringGeometry args={[1.05, 1.12, 48]} />
          <meshBasicMaterial color={baseHoloColor} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* Mid Dashed Ring */}
        <mesh ref={holoDiscRef}>
          <ringGeometry args={[0.7, 0.74, 32]} />
          <meshBasicMaterial color="#c4b5fd" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>

        {/* Center Target Disc */}
        <mesh>
          <circleGeometry args={[0.35, 32]} />
          <meshBasicMaterial color={baseHoloColor} transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>

        {/* Soft Holographic Ambient Glow Cone */}
        <mesh position={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.6, 1.1, 0.4, 32, 1, true]} />
          <meshBasicMaterial
            color={baseHoloColor}
            transparent
            opacity={0.07}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function HoneypotCube({ type = "SSH", deceptionLevel = "HIGH", className = "h-36 w-36" }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative flex items-center justify-center ${className} select-none`}>
      {!hasError ? (
        <Canvas onError={() => setHasError(true)} gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[0, 0.1, 2.9]} fov={40} />
          <ambientLight intensity={1.6} />
          <directionalLight position={[4, 6, 5]} intensity={2.2} color="#ffffff" />
          <pointLight position={[-4, -3, 2]} intensity={2.0} color="#8b5cf6" />
          <pointLight position={[3, -2, 2]} intensity={1.2} color="#c4b5fd" />

          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
            <HoneypotServerAppliance type={type} deceptionLevel={deceptionLevel} />
          </Float>
        </Canvas>
      ) : (
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-mono font-bold text-sm shadow-inner">
            {type}
          </div>
          <span className="text-[10px] font-bold text-purple-600 mt-1 uppercase">{deceptionLevel} DECEPTION</span>
        </div>
      )}

      {/* Soft Ambient Radial Blur Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-purple-400/25 blur-2xl" />
      </div>
    </div>
  );
}
