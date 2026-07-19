import { describe, it, expect, beforeEach } from 'vitest';
import { getIoTState, addIncident } from '@/utils/iotState';

describe('IoT State Manager', () => {
  it('should initialize successfully', () => {
    const state = getIoTState();
    expect(state).toBeDefined();
    expect(state.stadium).toBeDefined();
    expect(Array.isArray(state.nodes)).toBe(true);
    expect(Array.isArray(state.flashSales)).toBe(true);
  });

  it('should generate initial crowd densities between 20 and 80', () => {
    const state = getIoTState();
    const allDensitiesValid = state.nodes.every(node => {
      if (node.crowdDensity === undefined) return true;
      return node.crowdDensity >= 20 && node.crowdDensity <= 80;
    });
    expect(allDensitiesValid).toBe(true);
  });

  it('should add incidents correctly and limit to 10', () => {
    for (let i = 0; i < 15; i++) {
      addIncident({ id: i, type: 'FAN REPORTED' });
    }
    const state = getIoTState();
    expect(state.incidents.length).toBe(10);
    expect(state.incidents[0].id).toBe(14); // the most recent one
  });
});
