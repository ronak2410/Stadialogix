import Graph from 'graphology';
import shortestPath from 'graphology-shortest-path';
import { getIoTState } from './iotState';
import { StadiumNode } from '@/types';

// Global map coordinates matching COORDINATES in StadiumMap.tsx
export const COORDINATES: Record<string, [number, number]> = {
  // Gates
  'gate-verizon': [40.8122, -74.0745],
  'gate-sap': [40.8135, -74.0735],
  'gate-pepsi': [40.8142, -74.0750],
  'gate-budlight': [40.8130, -74.0760],
  
  // Sections
  'sec-100': [40.8128, -74.0740],
  'sec-120': [40.8132, -74.0742],
  'sec-200': [40.8135, -74.0745],
  'sec-300': [40.8138, -74.0748],
  
  // Vendors & Amenities
  'vendor-pizza-1': [40.8129, -74.0738],
  'vendor-taco-1': [40.8133, -74.0748],
  'restroom-101': [40.8130, -74.0741],
  'medical-1': [40.8134, -74.0744],
  'merch-main': [40.8125, -74.0742],
  'premium-coaches-club': [40.8136, -74.0750],
  
  // Transit
  'transit-nj-rail': [40.8145, -74.0720],
  'parking-lot-e': [40.8115, -74.0765],
  'parking-lot-f': [40.8105, -74.0755],
  'parking-lot-g': [40.8155, -74.0730],
  'rideshare': [40.8160, -74.0780],
  
  // Roads
  'highway-route3': [40.8090, -74.0750],
  'highway-route120': [40.8150, -74.0770],
  'highway-nj-turnpike': [40.8170, -74.0710],
  
  // Custom Pathfinding Waypoints (Intersections/Hallways)
  'waypoint-concourse-east': [40.8132, -74.0732],
  'waypoint-concourse-west': [40.8132, -74.0755],
  'waypoint-concourse-north': [40.8140, -74.0742],
  'waypoint-concourse-south': [40.8124, -74.0742],
  
  // Elevators for accessibility
  'elevator-east': [40.8134, -74.0734],
  'elevator-west': [40.8134, -74.0753],
};

let standardGraph: Graph | null = null;
let accessibleGraph: Graph | null = null;

export function buildRoutingGraph(avoidStairs: boolean = false) {
  if (avoidStairs && accessibleGraph) return accessibleGraph;
  if (!avoidStairs && standardGraph) return standardGraph;

  const graph = new Graph();
  const state = getIoTState();

  // 1. Add all nodes to graph
  Object.keys(COORDINATES).forEach(id => {
    graph.addNode(id, { x: COORDINATES[id][0], y: COORDINATES[id][1] });
  });

  // 2. Helper to add bidirectional edges with weight (distance)
  const addEdge = (node1: string, node2: string, type: 'flat' | 'stairs' = 'flat') => {
    if (!graph.hasNode(node1) || !graph.hasNode(node2)) return;
    if (avoidStairs && type === 'stairs') return; // Skip stairs for accessibility mode
    
    const [x1, y1] = COORDINATES[node1];
    const [x2, y2] = COORDINATES[node2];
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    let penalty = 1.0;
    const nodeState = state.nodes.find((n: StadiumNode) => n.id === node2 || n.id === node1);
    if (nodeState && nodeState.crowdDensity) {
      if (nodeState.crowdDensity > 80) penalty = 3.0; // Heavy penalty to route around crowds
      else if (nodeState.crowdDensity > 50) penalty = 1.5;
    }

    graph.addUndirectedEdge(node1, node2, { weight: distance * penalty });
  };

  // 3. Define paths (Edges)
  addEdge('gate-verizon', 'waypoint-concourse-south');
  addEdge('gate-sap', 'waypoint-concourse-east');
  addEdge('gate-pepsi', 'waypoint-concourse-north');
  addEdge('gate-budlight', 'waypoint-concourse-west');

  addEdge('waypoint-concourse-south', 'waypoint-concourse-east');
  addEdge('waypoint-concourse-east', 'waypoint-concourse-north');
  addEdge('waypoint-concourse-north', 'waypoint-concourse-west');
  addEdge('waypoint-concourse-west', 'waypoint-concourse-south');

  addEdge('merch-main', 'waypoint-concourse-south');
  addEdge('vendor-pizza-1', 'waypoint-concourse-south');
  addEdge('vendor-taco-1', 'waypoint-concourse-west');
  addEdge('medical-1', 'waypoint-concourse-east');
  addEdge('premium-coaches-club', 'waypoint-concourse-west');
  addEdge('restroom-101', 'waypoint-concourse-east');

  addEdge('sec-100', 'waypoint-concourse-south');
  
  // Upper level sections (usually require stairs)
  addEdge('sec-120', 'waypoint-concourse-east', 'stairs');
  addEdge('sec-200', 'waypoint-concourse-east', 'stairs');
  addEdge('sec-300', 'waypoint-concourse-north', 'stairs');

  // Elevators provide flat access to upper sections
  addEdge('waypoint-concourse-east', 'elevator-east');
  addEdge('elevator-east', 'sec-120');
  addEdge('elevator-east', 'sec-200');
  
  addEdge('waypoint-concourse-west', 'elevator-west');
  addEdge('waypoint-concourse-north', 'elevator-west');
  addEdge('elevator-west', 'sec-300');

  // External connections
  addEdge('transit-nj-rail', 'gate-sap');
  addEdge('transit-nj-rail', 'gate-pepsi');
  addEdge('rideshare', 'highway-route120');
  
  addEdge('parking-lot-e', 'gate-budlight');
  addEdge('parking-lot-f', 'gate-verizon');
  addEdge('parking-lot-g', 'gate-pepsi');

  if (avoidStairs) {
    accessibleGraph = graph;
  } else {
    standardGraph = graph;
  }
  return graph;
}

export function getShortestPath(startId: string, targetId: string, avoidStairs: boolean = false): [number, number][] {
  const graph = buildRoutingGraph(avoidStairs);
  
  if (!graph.hasNode(startId) || !graph.hasNode(targetId)) {
    return [];
  }

  try {
    const path = shortestPath.dijkstra.bidirectional(graph, startId, targetId, 'weight');
    if (!path) return [];
    
    return path.map((nodeId: string) => COORDINATES[nodeId]);
  } catch (error) {
    console.error("Pathfinding error:", error);
    return [];
  }
}

export function findAStarPath(nodes: StadiumNode[], startId: string, endId: string, avoidStairs: boolean = false): [number, number][] {
  return getShortestPath(startId, endId, avoidStairs);
}
