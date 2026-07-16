"use client";
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ZoomIn, ZoomOut, Maximize, Navigation, Info } from 'lucide-react';
import stadiumData from '@/data/stadium_data.json';
import 'leaflet/dist/leaflet.css';
import { StadiumNode } from '@/types';
import { sanitizeHtml } from '@/utils/sanitize';

// Geographic Coordinates for all 21 nodes centered on MetLife Stadium [40.8135, -74.0744]
const COORDINATES: Record<string, [number, number]> = {
  // Gates
  "gate-verizon": [40.8145, -74.0758],   // Northwest
  "gate-sap": [40.8123, -74.0728],       // Southeast
  "gate-pepsi": [40.8148, -74.0734],     // Northeast
  "gate-budlight": [40.8121, -74.0753],  // Southwest

  // Bowls
  "sec-100": [40.8131, -74.0746],        // Lower Bowl
  "sec-200": [40.8135, -74.0739],        // Mezzanine Bowl
  "sec-300": [40.8139, -74.0743],        // Upper Bowl

  // Logistics / Transit
  "rideshare": [40.8188, -74.0682],      // Meadowlands Racing (Rideshare pickup)
  "transit-nj-rail": [40.8116, -74.0769], // NJ Transit Meadowlands Rail Station

  // Vendors
  "vendor-pizza-1": [40.8131, -74.0737],  // Nonna's Pizzeria (Southeast inner concourse)
  "vendor-taco-1": [40.8140, -74.0736],   // Global Tacos (Northeast inner concourse)
  "merch-main": [40.8144, -74.0732],      // FIFA Official Superstore (Plaza Level near Pepsi)

  // Amenities
  "premium-coaches-club": [40.8134, -74.0731], // Coaches Club (Mezzanine Level East)
  "restroom-101": [40.8141, -74.0749],    // Restroom Section 101 (Lower Bowl NW)
  "medical-1": [40.8124, -74.0752],       // First Aid Station (Plaza Level near Bud Light)

  // Highways
  "highway-route3": [40.8202, -74.0768],   // Route 3 Highway (North)
  "highway-route120": [40.8160, -74.0689], // Route 120 (East)
  "highway-nj-turnpike": [40.8058, -74.0738], // NJ Turnpike (South)

  // Parking Lots
  "parking-lot-e": [40.8152, -74.0782],   // Parking Lot E (West)
  "parking-lot-f": [40.8168, -74.0755],   // Parking Lot F (Northwest)
  "parking-lot-g": [40.8112, -74.0718],   // Parking Lot G (East/Southeast)
};

interface StadiumMapProps {
  activeLocation: string;
  accessibilityMode?: boolean;
  showHeatmap?: boolean;
  evacuationMode?: boolean;
}

const StadiumMap = React.memo(function StadiumMap({ 
  activeLocation, 
  accessibilityMode = false, 
  showHeatmap = false,
  evacuationMode = false
}: StadiumMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const routingLineRef = useRef<L.Polyline | null>(null);
  const heatmapLayersRef = useRef<L.Circle[]>([]);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Helper to match activeLocation string to a node
  const getMatchingNode = (text: string) => {
    if (!text) return null;
    const lower = text.toLowerCase();

    // Direct match check
    for (const node of stadiumData.nodes) {
      if (lower.includes(node.id.toLowerCase()) || lower.includes(node.name.toLowerCase())) {
        return node;
      }
    }

    // Match keywords to specific entities
    if (lower.includes('pizza') || lower.includes('nonna')) return stadiumData.nodes.find(n => n.id === 'vendor-pizza-1');
    if (lower.includes('taco') || lower.includes('global')) return stadiumData.nodes.find(n => n.id === 'vendor-taco-1');
    if (lower.includes('superstore') || lower.includes('merch') || lower.includes('shop') || lower.includes('jersey')) return stadiumData.nodes.find(n => n.id === 'merch-main');
    if (lower.includes('coaches') || lower.includes('vip') || lower.includes('suite')) return stadiumData.nodes.find(n => n.id === 'premium-coaches-club');
    if (lower.includes('restroom') || lower.includes('bathroom') || lower.includes('toilet') || lower.includes('washroom')) return stadiumData.nodes.find(n => n.id === 'restroom-101');
    if (lower.includes('first aid') || lower.includes('medical') || lower.includes('doctor')) return stadiumData.nodes.find(n => n.id === 'medical-1');
    if (lower.includes('rideshare') || lower.includes('uber') || lower.includes('lyft') || lower.includes('racing') || lower.includes('pickup')) return stadiumData.nodes.find(n => n.id === 'rideshare');
    if (lower.includes('train') || lower.includes('transit') || lower.includes('rail') || lower.includes('station') || lower.includes('nj transit')) return stadiumData.nodes.find(n => n.id === 'transit-nj-rail');
    if (lower.includes('verizon')) return stadiumData.nodes.find(n => n.id === 'gate-verizon');
    if (lower.includes('sap')) return stadiumData.nodes.find(n => n.id === 'gate-sap');
    if (lower.includes('pepsi')) return stadiumData.nodes.find(n => n.id === 'gate-pepsi');
    if (lower.includes('bud light') || lower.includes('budlight')) return stadiumData.nodes.find(n => n.id === 'gate-budlight');
    if (lower.includes('lot e')) return stadiumData.nodes.find(n => n.id === 'parking-lot-e');
    if (lower.includes('lot f')) return stadiumData.nodes.find(n => n.id === 'parking-lot-f');
    if (lower.includes('lot g')) return stadiumData.nodes.find(n => n.id === 'parking-lot-g');
    if (lower.includes('route 3')) return stadiumData.nodes.find(n => n.id === 'highway-route3');
    if (lower.includes('120')) return stadiumData.nodes.find(n => n.id === 'highway-route120');
    if (lower.includes('turnpike') || lower.includes('i-95')) return stadiumData.nodes.find(n => n.id === 'highway-nj-turnpike');
    if (lower.includes('lower') || lower.includes('100') || lower.includes('section 1')) return stadiumData.nodes.find(n => n.id === 'sec-100');
    if (lower.includes('mezzanine') || lower.includes('200') || lower.includes('section 2')) return stadiumData.nodes.find(n => n.id === 'sec-200');
    if (lower.includes('upper') || lower.includes('300') || lower.includes('section 3')) return stadiumData.nodes.find(n => n.id === 'sec-300');

    return null;
  };

  // Get closest gate coordinate to a target node
  const getClosestGateCoord = (targetCoord: [number, number]): [number, number] => {
    const gates: [number, number][] = [
      COORDINATES["gate-verizon"],
      COORDINATES["gate-pepsi"],
      COORDINATES["gate-sap"],
      COORDINATES["gate-budlight"]
    ];
    let closest = gates[0];
    let minDist = Infinity;
    
    gates.forEach(gate => {
      const dist = Math.pow(gate[0] - targetCoord[0], 2) + Math.pow(gate[1] - targetCoord[1], 2);
      if (dist < minDist) {
        minDist = dist;
        closest = gate;
      }
    });
    return closest;
  };

  // HTML Content Generator for Custom Pins to match the design aesthetics of Google Maps
  const createMarkerHtml = (node: StadiumNode, isHighlighted: boolean) => {
    let bgColor = 'bg-slate-600';
    let icon = '📍';
    let pulseDiv = '';

    if (isHighlighted) {
      pulseDiv = '<div class="absolute -inset-2 rounded-full bg-rose-500 animate-ping opacity-60 pointer-events-none"></div>';
    }

    switch (node.type) {
      case 'gate':
        bgColor = 'bg-rose-600 border border-rose-400 text-white shadow-[0_0_12px_rgba(225,29,72,0.8)]';
        icon = '🚪';
        break;
      case 'seating':
        bgColor = 'bg-indigo-600 border border-indigo-400 text-white shadow-[0_0_12px_rgba(79,70,229,0.8)]';
        icon = '💺';
        break;
      case 'vendor':
        bgColor = 'bg-amber-500 border border-amber-300 text-white shadow-[0_0_12px_rgba(245,158,11,0.8)]';
        if (node.id.includes('pizza')) icon = '🍕';
        else if (node.id.includes('taco')) icon = '🌮';
        else icon = '🛍️';
        break;
      case 'amenity':
        bgColor = 'bg-teal-500 border border-teal-300 text-white shadow-[0_0_12px_rgba(20,184,166,0.8)]';
        if (node.id.includes('club')) {
          bgColor = 'bg-yellow-600 border border-yellow-400 text-white shadow-[0_0_12px_rgba(202,138,4,0.8)]';
          icon = '👑';
        } else if (node.id.includes('restroom')) icon = '🚻';
        else if (node.id.includes('medical')) icon = '🏥';
        break;
      case 'logistics':
        if (node.id.includes('rideshare')) {
          bgColor = 'bg-emerald-600 border-2 border-white text-white shadow-lg shadow-emerald-500/30';
          icon = '🏇';
        } else if (node.id.includes('rail')) {
          bgColor = 'bg-blue-600 border-2 border-white text-white shadow-lg shadow-blue-500/30';
          icon = '🚆';
        } else if (node.id.includes('parking')) {
          bgColor = 'bg-blue-500 border border-blue-300 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]';
          icon = '🅿️';
        } else if (node.id.includes('highway') || node.id.includes('route')) {
          bgColor = 'bg-slate-700 border border-slate-500 text-white';
          icon = '🛣️';
        }
        break;
    }

    // Specific custom overrides to replicate Google Maps aesthetics
    if (node.id === 'highway-route3') {
      return `
        <div class="flex flex-col items-center justify-center">
          <div class="w-6 h-6 bg-white text-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center font-extrabold text-[10px] shadow-md">3</div>
          <span class="text-[8px] font-bold text-white bg-slate-900/90 px-1 py-0.5 rounded border border-slate-700 whitespace-nowrap mt-0.5">Route 3</span>
        </div>
      `;
    }
    if (node.id === 'highway-route120') {
      return `
        <div class="flex flex-col items-center justify-center">
          <div class="w-6 h-6 bg-white text-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center font-extrabold text-[10px] shadow-md">120</div>
          <span class="text-[8px] font-bold text-white bg-slate-900/90 px-1 py-0.5 rounded border border-slate-700 whitespace-nowrap mt-0.5">Route 120</span>
        </div>
      `;
    }
    if (node.id === 'highway-nj-turnpike') {
      return `
        <div class="flex flex-col items-center justify-center">
          <div class="w-6 h-6 bg-blue-900 text-white border border-white rounded-full flex items-center justify-center font-black text-[8px] shadow-md">I-95</div>
          <span class="text-[8px] font-bold text-white bg-slate-900/90 px-1 py-0.5 rounded border border-slate-700 whitespace-nowrap mt-0.5">NJ Turnpike</span>
        </div>
      `;
    }
    if (node.name.toLowerCase().includes('nickelodeon')) {
      bgColor = 'bg-purple-600 border-2 border-white text-white shadow-lg shadow-purple-500/40';
      icon = '🎡';
    }
    if (node.name.toLowerCase().includes('werecoverdata')) {
      bgColor = 'bg-white border-2 border-red-500 text-red-500 shadow-lg';
      icon = '🔴';
    }
    if (node.name.toLowerCase().includes('jd sports')) {
      bgColor = 'bg-black border-2 border-white text-white shadow-lg';
      icon = '👟';
    }

    return sanitizeHtml(`
      <div class="relative flex flex-col items-center group">
        ${pulseDiv}
        <div class="w-7 h-7 ${bgColor} rounded-full flex items-center justify-center text-[13px] shadow-md border-2 border-white transition-all transform group-hover:scale-110 z-10">
          ${icon}
        </div>
        <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white -mt-[1px] z-10"></div>
        <div class="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-950/80 text-white border border-slate-800/80 rounded px-1 py-0.5 text-[8px] font-extrabold whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
          ${node.name}
        </div>
      </div>
    `);
  };

  // Leaflet Initialization & State Syncing
  useEffect(() => {
    let active = true;
    let mapInstance: L.Map | null = null;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (!active) return;
      if (!mapContainerRef.current) return;

      // Prevent double initialization if container already has a map
      if ((mapContainerRef.current as HTMLDivElement & { _leaflet_id?: boolean })._leaflet_id) {
        return;
      }

      // Initialize map instance
      mapInstance = L.map(mapContainerRef.current, {
        zoomControl: false,
        center: [40.8135, -74.0744],
        zoom: 15,
        minZoom: 13,
        maxZoom: 18
      });

      mapRef.current = mapInstance;
      setMapReady(true);
      setTimeout(() => {
        mapInstance?.invalidateSize();
      }, 0);

      // 1. Satellite Base Tiles (Esri World Imagery)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }).addTo(mapInstance);

      // 2. Hybrid Transparent Street Labels Overlay
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        opacity: 0.85,
        pane: 'shadowPane'
      }).addTo(mapInstance);

      // Add stadium boundary circle
      L.circle([40.8135, -74.0744], {
        color: '#f43f5e',
        fillColor: 'transparent',
        fillOpacity: 0,
        radius: 160,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(mapInstance);

      // Add all 21 data nodes as Leaflet markers
      stadiumData.nodes.forEach((node: unknown) => {
        const typedNode = node as StadiumNode;
        const coords = COORDINATES[typedNode.id];
        if (!coords) return;

        // Custom DivIcon
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: createMarkerHtml(typedNode, false),
          iconSize: [60, 45],
          iconAnchor: [30, 31]
        });

        // Popup Content
        let waitTimeHtml = '';
        if (typedNode.type === 'vendor') {
          // Phase 3: Predictive Concession Wait Time (derived from crowd density)
          const estWaitMins = Math.max(2, Math.floor((typedNode.crowdDensity || 10) / 4));
          const waitColor = estWaitMins > 15 ? 'text-red-400' : estWaitMins > 8 ? 'text-amber-400' : 'text-emerald-400';
          waitTimeHtml = `
            <div class="mt-2 text-[10px] bg-slate-900 rounded p-1.5 border border-slate-700">
              <span class="text-slate-400 block mb-0.5">AI Wait Time Prediction:</span>
              <span class="font-bold ${waitColor}">${estWaitMins} mins</span>
              ${estWaitMins > 10 ? '<br/><span class="text-[9px] text-amber-300">Tip: Check Global Tacos for faster service!</span>' : ''}
            </div>
          `;
        }

        const popupHtml = sanitizeHtml(`
          <div class="p-3 text-slate-100 font-sans max-w-[240px]">
            <h3 class="font-extrabold text-sm mb-1 text-white flex items-center gap-1.5 border-b border-slate-700/60 pb-1.5">
              ${typedNode.type === 'gate' ? '🚪' : typedNode.type === 'vendor' ? '🍕' : '📍'} ${typedNode.name}
            </h3>
            <p class="text-[11px] leading-relaxed text-slate-300 mt-1.5 font-medium">${typedNode.description}</p>
            ${waitTimeHtml}
            <div class="space-y-1.5 text-xs">
              ${typedNode.currentQueueTime !== undefined ? `<p class="flex justify-between"><span class="text-slate-400">Queue Time:</span> <span class="font-bold text-cyan-400">${typedNode.currentQueueTime} mins</span></p>` : ''}
              ${typedNode.crowdDensity !== undefined ? `<p class="flex justify-between"><span class="text-slate-400">Crowd Density:</span> <span class="font-bold ${typedNode.crowdDensity > 80 ? 'text-red-400' : typedNode.crowdDensity > 50 ? 'text-amber-400' : 'text-emerald-400'}">${typedNode.crowdDensity}%</span></p>` : ''}
              ${typedNode.wasteBinLevel !== undefined ? `<p class="flex justify-between"><span class="text-slate-400">Waste Level:</span> <span class="font-bold ${typedNode.wasteBinLevel > 80 ? 'text-red-400' : 'text-slate-300'}">${typedNode.wasteBinLevel}%</span></p>` : ''}
              ${typedNode.offerings ? `<p class="text-slate-400 mt-1"><span class="block font-bold text-white mb-0.5">Offerings:</span> ${typedNode.offerings.join(', ')}</p>` : ''}
              ${typedNode.location ? `<p class="text-slate-400 mt-1"><span class="block font-bold text-white mb-0.5">Location:</span> ${typedNode.location}</p>` : ''}
              ${typedNode.details ? `<p class="text-slate-400 mt-1 text-[11px] leading-relaxed">${typedNode.details}</p>` : ''}
            </div>
            ${typedNode.isAccessible ? `
              <div class="mt-2.5 pt-1.5 border-t border-slate-700/60 flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                <span class="p-1 bg-emerald-500/10 rounded border border-emerald-500/20"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 9a3 3 0 1 1 6 0 3 3 0 0 1-6 0z"/><path d="M12 12v6"/><path d="M12 18H9m6 0h-3m-6.5-6h13"/></svg></span> Accessible Area
              </div>
            ` : ''}
            ${typedNode.dynamicRouting ? `
              <div class="mt-2.5 pt-1.5 border-t border-slate-700/60 flex items-start gap-1.5 text-amber-400 text-[10px] leading-snug font-medium">
                <span class="p-0.5 mt-0.5"><svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></span>
                <div><span class="font-extrabold block text-amber-300">Reroute Advisory</span> ${typedNode.dynamicRouting}</div>
              </div>
            ` : ''}
          </div>
        `);

        const marker = L.marker(coords, { icon: customIcon })
          .bindPopup(popupHtml, {
            maxWidth: 260,
            className: 'custom-leaflet-popup'
          })
          .addTo(mapInstance!);

        markersRef.current[typedNode.id] = marker;
      });
    };

    initMap();

    // Clean up
    return () => {
      active = false;
      if (mapInstance) {
        mapInstance.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync Heatmap circles (Phase 8: Staff Side Overlay)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing heatmap layers
    heatmapLayersRef.current.forEach(layer => layer.remove());
    heatmapLayersRef.current = [];

    if (showHeatmap) {
      import('leaflet').then((LModule) => {
        const L = LModule.default;
        
        // Define some crowded spots matching the user's pins
        const hotspots: { coords: [number, number]; color: string; radius: number }[] = [
          { coords: COORDINATES["gate-verizon"], color: '#ef4444', radius: 45 },
          { coords: COORDINATES["gate-pepsi"], color: '#ef4444', radius: 55 },
          { coords: COORDINATES["parking-lot-e"], color: '#f59e0b', radius: 65 },
          { coords: COORDINATES["vendor-pizza-1"], color: '#f59e0b', radius: 35 },
          { coords: [40.8135, -74.0744], color: '#ef4444', radius: 40 }, // Pitch area
        ];

        hotspots.forEach(spot => {
          const circle = L.circle(spot.coords, {
            color: spot.color,
            fillColor: spot.color,
            fillOpacity: 0.4,
            radius: spot.radius,
            weight: 1,
            className: 'animate-pulse'
          }).addTo(map);
          heatmapLayersRef.current.push(circle);
        });
      });
    }
  }, [showHeatmap, mapReady]);

  // Sync Active Location (panning, opening popups, drawing walking routes)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    // Reset route polyline
    if (routingLineRef.current) {
      routingLineRef.current.remove();
      routingLineRef.current = null;
    }

    const node = getMatchingNode(activeLocation);
    if (!node) {
      setHighlightedNodeId(null);
      return;
    }

    const coords = COORDINATES[node.id];
    if (!coords) return;

    setHighlightedNodeId(node.id);

    // Pan map to active node
    map.setView(coords, 17, { animate: true, duration: 1 });

    // Open target popup
    const marker = markersRef.current[node.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 300);
    }

    // Dynamic routing: Draw animated line from closest gate to target node (Phase 13: Accessibility Support)
    if (node.type !== 'gate' && node.id !== 'highway-route3' && node.id !== 'highway-route120' && node.id !== 'highway-nj-turnpike') {
      import('leaflet').then((LModule) => {
        const L = LModule.default;
        const gateCoord = getClosestGateCoord(coords);
        
        let pathPoints: [number, number][] = [gateCoord, coords];

        // If Accessibility Mode is ON, route through the elevator node [40.8138, -74.0752]
        if (accessibilityMode) {
          const adaElevatorCoord: [number, number] = [40.8138, -74.0752];
          pathPoints = [gateCoord, adaElevatorCoord, coords];
        }

        // Phase 3: Evacuation Routing Override
        if (evacuationMode) {
          // Route everyone to closest outer highway/gate
          pathPoints = [coords, [40.8135, -74.0744], [40.8188, -74.0682]]; // Route to Rideshare/Exit
        }

        // Draw route polyline
        const routeLine = L.polyline(pathPoints, {
          color: evacuationMode ? '#ef4444' : accessibilityMode ? '#06b6d4' : '#f43f5e',
          weight: evacuationMode ? 6 : accessibilityMode ? 5 : 4,
          opacity: 0.8,
          className: evacuationMode ? 'routing-polyline animate-pulse' : accessibilityMode ? 'routing-polyline accessible-polyline' : 'routing-polyline'
        }).addTo(map);

        routingLineRef.current = routeLine;
      });
    }

  }, [activeLocation, accessibilityMode, evacuationMode, mapReady]);

  // Update HTML styles dynamically when node highlighted
  useEffect(() => {
    import('leaflet').then((LModule) => {
      const L = LModule.default;
      stadiumData.nodes.forEach((n: unknown) => {
        const node = n as StadiumNode;
        const marker = markersRef.current[node.id];
        if (marker) {
          const isHighlighted = node.id === highlightedNodeId;
          marker.setIcon(
            L.divIcon({
              className: 'custom-leaflet-marker',
              html: createMarkerHtml(node, isHighlighted),
              iconSize: [60, 45],
              iconAnchor: [30, 31]
            })
          );
        }
      });
    });
  }, [highlightedNodeId, mapReady]);

  // Reset view to overview MetLife Stadium
  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([40.8135, -74.0744], 15, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-stretch p-4 bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden select-none">
      
      {/* Global CSS overrides for Leaflet styling */}
      <style>{`
        .leaflet-container {
          background: #182312 !important; /* Grass swamp fallback background */
        }
        .leaflet-control-attribution {
          background: rgba(15, 23, 42, 0.7) !important;
          color: #94a3b8 !important;
          backdrop-filter: blur(4px) !important;
          border-top-left-radius: 8px;
        }
        .leaflet-control-attribution a {
          color: #38bdf8 !important;
        }
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          color: #f1f5f9 !important;
          border: 1px solid rgba(148, 163, 184, 0.2) !important;
          border-radius: 1.25rem !important;
          backdrop-filter: blur(12px) !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5) !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(148, 163, 184, 0.2) !important;
        }
        .custom-leaflet-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 8px !important;
        }
        .routing-polyline {
          stroke-dasharray: 8, 8;
          animation: dash 15s linear infinite;
        }
        .accessible-polyline {
          stroke-dasharray: 4, 6 !important;
          animation: dash 10s linear infinite !important;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -400;
          }
        }
      `}</style>

      {/* Header Overlay */}
      <h2 className="absolute top-6 left-8 text-md font-extrabold text-white tracking-widest uppercase flex items-center gap-2 z-[1000] bg-slate-950/80 px-4 py-2 rounded-full border border-slate-800 shadow-md">
        <MapPin className="text-rose-500 w-4 h-4" /> MetLife Stadium
      </h2>
      
      {/* Controls Overlay */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 z-[1000]">
        <button 
          onClick={() => mapRef.current?.zoomIn()} 
          className="p-2 bg-slate-950/80 hover:bg-slate-900 text-slate-300 rounded-full backdrop-blur shadow border border-slate-800 transition-colors"
          title="Zoom In"
        >
           <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={() => mapRef.current?.zoomOut()} 
          className="p-2 bg-slate-950/80 hover:bg-slate-900 text-slate-300 rounded-full backdrop-blur shadow border border-slate-800 transition-colors"
          title="Zoom Out"
        >
           <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={resetView} 
          className="p-2 bg-slate-950/80 hover:bg-slate-900 text-slate-300 rounded-full backdrop-blur shadow border border-slate-800 transition-colors"
          title="Reset View"
        >
           <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} aria-hidden="true" className="w-full flex-1 rounded-2xl overflow-hidden z-10 border border-slate-800 shadow-inner"></div>
      
      {/* Dynamic Routing Alert Banner */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-center z-[1000] pointer-events-none">
        {activeLocation && highlightedNodeId ? (
          <div className="px-5 py-2.5 flex items-center gap-2 bg-slate-950/90 border border-rose-500/40 rounded-full backdrop-blur-md animate-pulse shadow-lg pointer-events-auto">
             <Navigation className="w-3.5 h-3.5 text-rose-400" />
             <p className="text-[10px] font-extrabold text-rose-100 uppercase tracking-widest leading-none">
               Routing Active
             </p>
          </div>
        ) : (
          <div className="px-5 py-2 flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-full backdrop-blur-md pointer-events-auto">
             <Info className="w-3.5 h-3.5 text-slate-500" />
             <p className="text-[10px] font-bold text-slate-400 tracking-wider leading-none uppercase">Map Standby</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default StadiumMap;
