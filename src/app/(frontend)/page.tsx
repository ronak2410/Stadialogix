"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import { MapPin, ShieldAlert, Navigation } from 'lucide-react';
import * as THREE from 'three';

// 3D Stadium Component
function StadiumModel() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state: any) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05; // Slower rotation for realism
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Pitch (Grass) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={1} metalness={0.1} />
      </mesh>
      
      {/* Field Lines (Outer Boundary) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[11, 7]} />
        <meshBasicMaterial color="#ffffff" wireframe={true} transparent opacity={0.5} />
      </mesh>

      {/* Center Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.4, 1.5, 32]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      
      {/* Center Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.1, 7]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Penalty Boxes */}
      {[-4.5, 4.5].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
          <planeGeometry args={[2, 4]} />
          <meshBasicMaterial color="#ffffff" wireframe={true} />
        </mesh>
      ))}

      {/* Goalposts */}
      {[-5.5, 5.5].map((x, i) => (
        <group key={`goal-${i}`} position={[x, 0.5, 0]}>
          <mesh position={[0, 0, -1]}>
            <cylinderGeometry args={[0.05, 0.05, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 1]}>
            <cylinderGeometry args={[0.05, 0.05, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Tier 1 Seating Bowl (Lower) */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[8.5, 6, 1.6, 64, 1, true]} />
        {/* Adjusted to a lighter metallic slate to reflect the fuchsia/cyan point lights */}
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Tier 2 Seating Bowl (Upper) */}
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[11, 8.5, 2, 64, 1, true]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Stadium Roof / Canopy */}
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[10.5, 11.5, 0.2, 64, 1, true]} />
        <meshStandardMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.6} metalness={0.8} />
      </mesh>

      {/* Floating UI Cards attached to the 3D scene */}
      <Html position={[-6, 4, 0]} center>
        <Link href="/fan" aria-label="Enter Fan Mode" className="block w-64 p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-fuchsia-500/50 hover:bg-slate-800 transition-all shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:scale-105 transform cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center mb-4">
            <Navigation className="w-6 h-6 text-fuchsia-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Fan Mode</h2>
          <p className="text-slate-400 text-xs">Enter the interactive smart assistant & 3D routing experience.</p>
        </Link>
      </Html>

      <Html position={[6, 4, 0]} center>
        <Link href="/staff" aria-label="Enter Staff Mode" className="block w-64 p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/50 hover:bg-slate-800 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-105 transform cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Staff Ops</h2>
          <p className="text-slate-400 text-xs">Enter the Digital Twin command center and crowd heatmap.</p>
        </Link>
      </Html>
    </group>
  );
}

export default function LandingPage() {
  return (
    <main id="main-content" className="w-full min-h-[100svh] bg-slate-950 relative overflow-x-hidden flex flex-col">
      {/* Title Overlay */}
      <header className="absolute top-10 left-0 right-0 z-10 flex flex-col items-center pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-2xl mb-4">
           <MapPin className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 drop-shadow-lg">
          StadiaLogix 3D
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto text-center mt-4">
          Next-Generation Digital Twin & Fan Assistant
        </p>
      </header>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#d946ef" />
          <pointLight position={[-10, 10, -10]} intensity={1.5} color="#06b6d4" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <StadiumModel />
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2.5}
            minDistance={8}
            maxDistance={20}
          />
        </Canvas>
      </div>

      {/* Instructions Overlay */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <div className="bg-slate-900/60 backdrop-blur-md px-6 py-2 rounded-full border border-slate-800">
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Drag to rotate • Scroll to zoom
          </p>
        </div>
      </div>
    </main>
  );
}
