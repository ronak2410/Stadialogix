import { createMarkerHtml } from '@/utils/mapHelpers';
import { StadiumNode } from '@/types';

describe('Map Helpers', () => {
  it('should render standard node styles correctly', () => {
    const node: StadiumNode = { id: 'test', name: 'Standard Gate', type: 'gate' };
    const html = createMarkerHtml(node, false);
    expect(html).toContain('🚪');
    expect(html).toContain('Standard Gate');
  });

  it('should apply custom styling for Nickelodeon', () => {
    const node: StadiumNode = { id: 'nick', name: 'Nickelodeon Store', type: 'vendor' };
    const html = createMarkerHtml(node, false);
    expect(html).toContain('🎡');
    expect(html).toContain('bg-purple-600');
  });

  it('should render highway badges', () => {
    const node: StadiumNode = { id: 'highway-route3', name: 'Route 3', type: 'logistics' };
    const html = createMarkerHtml(node, false);
    expect(html).toContain('>3<');
    expect(html).toContain('Route 3');
  });

  it('should show density indicator for crowded areas', () => {
    const node: StadiumNode = { id: 'crowd', name: 'Crowd Test', type: 'seating', crowdDensity: 85 };
    const html = createMarkerHtml(node, false);
    expect(html).toContain('bg-red-500 animate-pulse');
  });
});
