'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import stadiumData from '@/data/stadium_data.json';
import { StadiumNode } from '@/types';

interface StadiumMap3DProps {
  activeLocation?: string;
}

// Convert 2D coordinates (0-100) to 3D space (-10 to 10)
const to3D = (val: number, max: number = 100, span: number = 20) => (val / max) * span - (span / 2);

function NodeMesh({ node, liveData, isActive }: { node: StadiumNode, liveData?: any, isActive: boolean }) {
  // Generate deterministic position since original JSON has no coordinates
  const seed = node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const angle = (seed % 360) * (Math.PI / 180);
  const radius = (seed % 8) + 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  // Base density from live data
  const density = liveData?.density || 0;
  
  // Map density to height and color
  const height = node.type === 'seating' ? 0.5 : (density / 100) * 3 + 0.5;
  
  const color = useMemo(() => {
    if (isActive) return '#3b82f6'; // Blue for active/target
    if (density < 40) return '#10b981'; // Green
    if (density < 75) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  }, [density, isActive]);

  const y = height / 2;

  return (
    <group position={[x, y, z]}>
      <mesh castShadow receiveShadow>
        {node.type === 'seating' ? (
           <boxGeometry args={[1.5, height, 1.5]} />
        ) : (
           <cylinderGeometry args={[0.5, 0.5, height, 16]} />
        )}
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={isActive ? 0.5 : 0.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Floating Label using HTML to avoid external font CDN fetches */}
      <Html
        position={[0, height / 2 + 0.5, 0]}
        center
        className="pointer-events-none whitespace-nowrap"
      >
        <div className="text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)] bg-slate-900/50 px-1 rounded backdrop-blur-sm">
          {node.name}
        </div>
      </Html>
      
      {/* Wait time for non-sections */}
      {node.type !== 'seating' && liveData?.estimatedWaitTime > 0 && (
        <Html
          position={[0, height / 2 + 0.9, 0]}
          center
          className="pointer-events-none whitespace-nowrap"
        >
          <div className={`text-[9px] font-bold px-1 rounded drop-shadow-md ${density > 75 ? 'text-red-200 bg-red-900/50' : 'text-green-200 bg-green-900/50'}`}>
            {liveData.estimatedWaitTime} min
          </div>
        </Html>
      )}
    </group>
  );
}

export default function StadiumMap3D({ activeLocation }: StadiumMap3DProps) {
  const [liveNodes, setLiveNodes] = useState<Record<string, any>>({});

  useEffect(() => {
    const evtSource = new EventSource('/api/stream');
    
    evtSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'iot_update') {
          const nodeMap = payload.data.reduce((acc: any, item: any) => {
            acc[item.id] = item;
            return acc;
          }, {});
          setLiveNodes(nodeMap);
        }
      } catch (e) {
        console.error('SSE Error', e);
      }
    };

    return () => evtSource.close();
  }, []);

  const nodes = (stadiumData as any).nodes as StadiumNode[];

  return (
    <div className="w-full h-full bg-slate-950 rounded-xl overflow-hidden relative shadow-inner">
      <Canvas shadows camera={{ position: [0, 15, 20], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight 
          castShadow 
          position={[10, 20, 10]} 
          intensity={1.5} 
          shadow-mapSize={[1024, 1024]}
        />
        
        {/* Base Grid/Pitch */}
        <mesh receiveShadow position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[25, 25]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        
        <gridHelper args={[25, 25, '#1e293b', '#0f172a']} position={[0, 0, 0]} />

        {/* Nodes */}
        {nodes.map(node => {
          const isActive = activeLocation ? activeLocation.toLowerCase().includes(node.name.toLowerCase()) : false;
          return (
            <NodeMesh 
              key={node.id} 
              node={node} 
              liveData={liveNodes[node.id]} 
              isActive={isActive} 
            />
          );
        })}

        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live SSE Feed
          </span>
        </div>
      </div>
    </div>
  );
}
