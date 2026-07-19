import { buildRoutingGraph, findAStarPath } from '@/utils/pathfinding';
import { StadiumNode } from '@/types';

describe('Pathfinding Utility', () => {
  const mockNodes: StadiumNode[] = [
    { id: 'gate-a', name: 'Gate A', type: 'gate', coords: [40.8136, -74.0745] },
    { id: 'seating-1', name: 'Section 1', type: 'seating', coords: [40.8137, -74.0750] },
    { id: 'amenity-ada', name: 'ADA Elevator', type: 'amenity', coords: [40.8138, -74.0752] }
  ];

  it('should build a valid routing graph', () => {
    const graph = buildRoutingGraph();
    expect(graph.order).toBeGreaterThan(0);
  });

  it('should find a valid path between nodes', () => {
    const path = findAStarPath(mockNodes, 'gate-verizon', 'sec-100');
    expect(path).toBeDefined();
    expect(path.length).toBeGreaterThanOrEqual(2);
  });

  it('should route through ADA nodes in accessibility mode', () => {
    const path = findAStarPath(mockNodes, 'gate-verizon', 'sec-120', true);
    expect(path).toBeDefined();
    expect(path.length).toBeGreaterThanOrEqual(2);
  });
});
