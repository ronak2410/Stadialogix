import { stadiumConfig } from '@/data/baseline_stadium';
import { StadiumNode } from '@/types';

// In-Memory Global Store for Live IoT Data
// This replaces the mock JSON file with a true dynamic state engine.
let liveStadiumState: {
  stadium: string;
  capacity: number;
  nodes: StadiumNode[];
  incidents: any[];
  flashSales: any[];
} | null = null;

let tickInterval: NodeJS.Timeout | null = null;

function initIoTState() {
  if (liveStadiumState) return;

  // Clone the baseline config
  liveStadiumState = {
    stadium: stadiumConfig.stadium,
    capacity: stadiumConfig.capacity,
    nodes: JSON.parse(JSON.stringify(stadiumConfig.nodes)),
    incidents: [],
    flashSales: []
  };

  // Initialize dynamic values
  liveStadiumState.nodes.forEach(node => {
    node.crowdDensity = Math.floor(Math.random() * 60) + 20; // 20-80%
    node.wasteBinLevel = Math.floor(Math.random() * 50); // 0-50%
    node.currentQueueTime = node.type === 'gate' || node.type === 'vendor' || node.type === 'restroom' ? Math.floor(Math.random() * 15) : 0;
  });

  // Start the tick loop (Queuing Theory Simulation)
  tickInterval = setInterval(() => {
    liveStadiumState!.nodes.forEach(node => {
      // Fluctuate density using a random walk
      const densityChange = Math.floor(Math.random() * 7) - 3; // -3 to +3
      node.crowdDensity = Math.max(0, Math.min(100, (node.crowdDensity || 0) + densityChange));

      // Waste bins slowly fill up
      if (node.type === 'vendor' || node.type === 'restroom') {
        node.wasteBinLevel = Math.max(0, Math.min(100, (node.wasteBinLevel || 0) + Math.floor(Math.random() * 2)));
      }

      // Queue times correlate loosely with crowd density
      if (node.type === 'gate' || node.type === 'vendor' || node.type === 'restroom') {
        const expectedQueue = Math.floor((node.crowdDensity || 0) / 4);
        const queueChange = Math.floor(Math.random() * 3) - 1;
        node.currentQueueTime = Math.max(0, expectedQueue + queueChange);
      }
    });

    // Dynamic Flash Sale Logic
    // If any gate is severely congested (>80%), trigger a flash sale at a distant location to draw crowds away.
    const congestedGates = liveStadiumState!.nodes.filter(n => n.type === 'gate' && (n.crowdDensity || 0) > 80);
    if (congestedGates.length > 0) {
      const targetGate = congestedGates[0]; // Take the first congested gate
      // Determine alternative gate
      const alternateGateName = targetGate.name.includes('Verizon') ? 'SAP Gate' : 'Verizon Gate';
      const alternateVendor = liveStadiumState!.nodes.find(n => n.type === 'vendor' && n.name.includes('Tacos')); // Or any vendor near the alternate gate
      
      const newFlashSale = {
        id: `fs_${Date.now()}`,
        trigger: targetGate.name,
        targetNode: alternateVendor ? alternateVendor.name : 'Global Tacos',
        message: `Flash Sale! 50% off at ${alternateVendor ? alternateVendor.name : 'Global Tacos'}! Avoid the congestion at ${targetGate.name}.`,
        expiresAt: Date.now() + 600000 // 10 minutes from now
      };

      // Check if we already have an active flash sale for this trigger
      const hasActive = liveStadiumState!.flashSales.some(fs => fs.trigger === targetGate.name && fs.expiresAt > Date.now());
      if (!hasActive) {
        liveStadiumState!.flashSales.push(newFlashSale);
      }
    }
    
    // Cleanup expired flash sales
    liveStadiumState!.flashSales = liveStadiumState!.flashSales.filter(fs => fs.expiresAt > Date.now());
  }, 3000); // Update every 3 seconds
}

export function getIoTState() {
  if (!liveStadiumState) {
    initIoTState();
  }
  return liveStadiumState!;
}

export function addIncident(incident: any) {
  if (!liveStadiumState) {
    initIoTState();
  }
  // Keep only the most recent 10 incidents in memory
  liveStadiumState!.incidents = [incident, ...liveStadiumState!.incidents].slice(0, 10);
}
