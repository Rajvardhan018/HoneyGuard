import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Crosshair } from 'lucide-react';

// Convert lat/lng to 3D Cartesian coordinates on sphere of radius R
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Generate quadratic bezier curve points between two geographic locations
function createArcCurve(v1, v2, radius) {
  const distance = v1.distanceTo(v2);
  const mid = v1.clone().add(v2).multiplyScalar(0.5);
  mid.setLength(radius + Math.max(0.4, distance * 0.35));
  return new THREE.QuadraticBezierCurve3(v1, mid, v2);
}

// Dynamic attack arc with traveling glowing photon pulse
function BallisticAttackArc({ startPos, endPos, color = "#ef4444", speed = 0.7, offset = 0 }) {
  const curve = useMemo(() => createArcCurve(startPos, endPos, 2.2), [startPos, endPos]);
  const lineGeometry = useMemo(() => {
    const points = curve.getPoints(40);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [curve]);

  const photonRef = useRef();

  useFrame((state) => {
    if (!photonRef.current || !curve) return;
    const t = (state.clock.getElapsedTime() * speed + offset) % 1;
    const pt = curve.getPointAt(t);
    photonRef.current.position.copy(pt);
  });

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.65} />
      </line>
      <mesh ref={photonRef}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// Beacon node at sensor or attack origin
function GeoNode({ position, color = "#ef4444", size = 0.08, isSensor = false, onHover, onLeave, isHovered }) {
  const meshRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      const pulse = 1 + Math.sin(t * (isSensor ? 5 : 3.5)) * (isHovered ? 0.35 : 0.2);
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
    if (ringRef.current) {
      const ringScale = 1 + (t * (isSensor ? 1.5 : 1.2)) % 2.0;
      const ringAlpha = Math.max(0, 1 - (ringScale - 1) / 2.0);
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
      ringRef.current.material.opacity = ringAlpha * 0.7;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onLeave?.();
        }}
      >
        <sphereGeometry args={[isHovered ? size * 1.5 : size, 16, 16]} />
        <meshBasicMaterial color={isHovered ? "#ffffff" : color} />
      </mesh>
      <mesh ref={ringRef} lookAt={() => new THREE.Vector3(0, 0, 0)}>
        <ringGeometry args={[size * 1.2, size * 1.8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function EarthGlobe({ nodes, sensorVec, hoveredNode, setHoveredNode, isPaused }) {
  const globeGroup = useRef();

  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/assets/earth_continents.png');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  useFrame(() => {
    if (globeGroup.current && !isPaused) {
      globeGroup.current.rotation.y += 0.0025;
    }
  });

  return (
    <group ref={globeGroup}>
      {/* 1. Realistic Earth Base Sphere with Continents Map */}
      <mesh>
        <sphereGeometry args={[2.2, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.7}
          metalness={0.15}
          emissive="#240c4a"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* 2. Atmospheric Glow Shell */}
      <mesh>
        <sphereGeometry args={[2.26, 36, 36]} />
        <meshPhysicalMaterial
          color="#a78bfa"
          transparent={true}
          opacity={0.12}
          transmission={0.8}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Outer Violet Corona Halo */}
      <mesh>
        <sphereGeometry args={[2.34, 32, 32]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent={true}
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 4. HoneyGuard Primary Sensor Hub (Frankfurt, DE) */}
      <GeoNode
        position={sensorVec}
        color="#10b981"
        size={0.11}
        isSensor={true}
        isHovered={hoveredNode?.isSensor}
        onHover={() => setHoveredNode({
          name: 'Frankfurt Hub (Primary Sensor)',
          country: 'Germany',
          flag: '🇩🇪',
          ip: 'HoneyGuard-DE-01',
          type: 'Sensor Ingress',
          severity: 'LOW',
          score: 12,
          isSensor: true
        })}
        onLeave={() => setHoveredNode(null)}
      />

      {/* 5. Inbound Threat Nodes & Ballistic Arcs */}
      {nodes.map((node, i) => (
        <React.Fragment key={i}>
          <GeoNode
            position={node.pos}
            color={node.color}
            size={0.075}
            isHovered={hoveredNode?.name === node.name}
            onHover={() => setHoveredNode(node)}
            onLeave={() => setHoveredNode(null)}
          />
          <BallisticAttackArc
            startPos={node.pos}
            endPos={sensorVec}
            color={node.color}
            speed={0.5 + (i % 3) * 0.25}
            offset={i * 0.18}
          />
        </React.Fragment>
      ))}
    </group>
  );
}

export default function ThreatGlobe({ className = 'h-[340px] w-full' }) {
  const [hoveredThreat, setHoveredThreat] = useState(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // HoneyGuard Sensor location (Frankfurt, DE: 50.1109° N, 8.6821° E)
  const sensorVec = useMemo(() => latLngToVector3(50.1109, 8.6821, 2.2), []);

  // Global Threat origins matching reference design and live telemetry
  const threatNodes = useMemo(() => [
    {
      name: 'Moscow Cluster',
      country: 'Russia',
      flag: '🇷🇺',
      lat: 55.7558,
      lng: 37.6173,
      ip: '185.220.101.45',
      type: 'SQL Injection & RCE',
      severity: 'CRITICAL',
      score: 96,
      color: '#ef4444'
    },
    {
      name: 'Virginia Node',
      country: 'United States',
      flag: '🇺🇸',
      lat: 38.9072,
      lng: -77.0369,
      ip: '198.51.100.24',
      type: 'Directory Traversal',
      severity: 'HIGH',
      score: 82,
      color: '#f59e0b'
    },
    {
      name: 'Hangzhou Hub',
      country: 'China',
      flag: '🇨🇳',
      lat: 30.2741,
      lng: 120.1551,
      ip: '114.119.160.8',
      type: 'SSH Brute Force',
      severity: 'CRITICAL',
      score: 94,
      color: '#ef4444'
    },
    {
      name: 'Mumbai Gateway',
      country: 'India',
      flag: '🇮🇳',
      lat: 19.0760,
      lng: 72.8777,
      ip: '103.21.244.12',
      type: 'Credential Stuffing',
      severity: 'HIGH',
      score: 88,
      color: '#f59e0b'
    },
    {
      name: 'Singapore Relay',
      country: 'Singapore',
      flag: '🇸🇬',
      lat: 1.3521,
      lng: 103.8198,
      ip: '128.199.200.12',
      type: 'Port Scanning Probe',
      severity: 'MEDIUM',
      score: 68,
      color: '#8b5cf6'
    },
    {
      name: 'Amsterdam Proxy',
      country: 'Netherlands',
      flag: '🇳🇱',
      lat: 52.3676,
      lng: 4.9041,
      ip: '194.26.29.112',
      type: 'Command Injection',
      severity: 'HIGH',
      score: 85,
      color: '#f59e0b'
    },
    {
      name: 'São Paulo Bot',
      country: 'Brazil',
      flag: '🇧🇷',
      lat: -23.5505,
      lng: -46.6333,
      ip: '177.18.99.41',
      type: 'SSH Auth Flood',
      severity: 'MEDIUM',
      score: 62,
      color: '#8b5cf6'
    },
    {
      name: 'London Relay',
      country: 'United Kingdom',
      flag: '🇬🇧',
      lat: 51.5074,
      lng: -0.1278,
      ip: '51.15.89.201',
      type: 'Reconnaissance Scan',
      severity: 'LOW',
      score: 34,
      color: '#10b981'
    }
  ].map(node => ({
    ...node,
    pos: latLngToVector3(node.lat, node.lng, 2.2)
  })), []);

  const activeTooltip = hoveredThreat || threatNodes[0];

  return (
    <div
      className={`relative ${className} select-none`}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => {
        setIsInteracting(false);
        setHoveredThreat(null);
      }}
    >
      <Canvas gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 1.2, 5.6]} fov={45} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[6, 6, 6]} intensity={2.2} color="#ffffff" />
        <pointLight position={[-6, -4, -4]} intensity={2.0} color="#8b5cf6" />
        <pointLight position={[0, 5, 2]} intensity={1.5} color="#c4b5fd" />

        <EarthGlobe
          nodes={threatNodes}
          sensorVec={sensorVec}
          hoveredNode={hoveredThreat}
          setHoveredNode={setHoveredThreat}
          isPaused={isInteracting}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.6}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>

      {/* Interactive Floating Threat Intelligence Card matching reference */}
      <div className="absolute top-3 right-3 z-10 p-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-xl text-xs w-52 pointer-events-none transition-all duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-base">{activeTooltip.flag}</span>
            <span className="font-bold text-slate-800 text-[11px] truncate">{activeTooltip.country}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
            activeTooltip.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
            activeTooltip.severity === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
            activeTooltip.severity === 'MEDIUM' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
            'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}>
            {activeTooltip.severity}
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-500">
            <span>IP:</span>
            <span className="font-mono font-semibold text-slate-800">{activeTooltip.ip}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Attack:</span>
            <span className="font-medium text-purple-700 text-right truncate max-w-[110px]" title={activeTooltip.type}>
              {activeTooltip.type}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-100/80">
            <span>Threat Score:</span>
            <span className="font-bold text-honey-indigo text-xs">
              {activeTooltip.score} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sensor Location Badge */}
      <div className="absolute bottom-2 right-3 z-10 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs text-[10px] font-semibold text-slate-600 pointer-events-none">
        <Crosshair className="w-3 h-3 text-emerald-600 animate-spin-slow" />
        <span>Sensor: Frankfurt, DE [ACTIVE]</span>
      </div>

      {/* Radial Atmospheric Glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 rounded-full bg-purple-400/20 blur-3xl" />
      </div>
    </div>
  );
}
