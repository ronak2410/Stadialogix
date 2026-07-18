import { StadiumNode } from '@/types';

// Simple heuristic: straight line distance
function heuristic(a: { x: number, y: number }, b: { x: number, y: number }) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function getPosition(node: StadiumNode) {
  const seed = node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const angle = (seed % 360) * (Math.PI / 180);
  const radius = (seed % 8) + 2;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

export function findAStarPath(nodes: StadiumNode[], startId: string, endId: string, avoidStairs: boolean = false): string[] {
  const start = nodes.find(n => n.id === startId);
  const end = nodes.find(n => n.id === endId);
  
  if (!start || !end) return [];

  // Build adjacency graph based on proximity for demo purposes
  // In a real app, 'edges' would be explicitly defined.
  // Here we dynamically connect nodes within a certain distance.
  const graph: Record<string, StadiumNode[]> = {};
  nodes.forEach(n1 => {
    graph[n1.id] = nodes.filter(n2 => {
      if (n1.id === n2.id) return false;
      const dist = heuristic(getPosition(n1), getPosition(n2));
      // Avoid stairs if requested (simulate by assuming 'gate' to 'section' might have stairs unless elevator)
      // For demo, if avoidStairs is true, we penalize paths going directly across center
      if (avoidStairs && (n2.name.toLowerCase().includes('stairs') || n2.name.toLowerCase().includes('escalator'))) {
        return false; 
      }
      return dist < 30; // Max connect distance
    });
  });

  const openSet = new Set([startId]);
  const cameFrom = new Map<string, string>();
  
  const gScore = new Map<string, number>();
  nodes.forEach(n => gScore.set(n.id, Infinity));
  gScore.set(startId, 0);

  const fScore = new Map<string, number>();
  nodes.forEach(n => fScore.set(n.id, Infinity));
  fScore.set(startId, heuristic(getPosition(start), getPosition(end)));

  while (openSet.size > 0) {
    let currentId = '';
    let lowestF = Infinity;
    
    openSet.forEach(id => {
      const f = fScore.get(id) || Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    });

    if (currentId === endId) {
      // Reconstruct path
      const path = [currentId];
      while (cameFrom.has(currentId)) {
        currentId = cameFrom.get(currentId)!;
        path.unshift(currentId);
      }
      return path;
    }

    openSet.delete(currentId);
    const neighbors = graph[currentId] || [];

    for (const neighbor of neighbors) {
      const currentNode = nodes.find(n => n.id === currentId)!;
      const tentativeG = (gScore.get(currentId) || Infinity) + heuristic(getPosition(currentNode), getPosition(neighbor));

      if (tentativeG < (gScore.get(neighbor.id) || Infinity)) {
        cameFrom.set(neighbor.id, currentId);
        gScore.set(neighbor.id, tentativeG);
        fScore.set(neighbor.id, tentativeG + heuristic(getPosition(neighbor), getPosition(end)));
        if (!openSet.has(neighbor.id)) {
          openSet.add(neighbor.id);
        }
      }
    }
  }

  return []; // No path found
}
