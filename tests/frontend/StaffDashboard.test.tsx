import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StaffDashboard from '@/app/(frontend)/staff/page';

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
  default: () => {
    return function MockMap() {
      return <div data-testid="mock-stadium-map">Mock Map</div>;
    };
  }
}));

describe('StaffDashboard Integration', () => {
  beforeEach(() => {
    // Mock global fetch for relative API URLs
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/live')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            nodes: [],
            match: {
              team1: 'USA',
              team2: 'Mexico',
              score1: 2,
              score2: 1,
              time: '85:00'
            }
          })
        });
      }
      if (url.includes('/api/staff')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            alerts: [
              {
                type: 'CROWD CONTROL',
                severity: 'HIGH',
                title: 'Verizon Gate Bottleneck',
                description: 'Crowd density is at 85% and queue time is 12 minutes.',
                action: 'Reroute incoming fans to SAP Gate.'
              }
            ]
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    }) as any;
  });

  it('renders the staff dashboard interface correctly', async () => {
    await act(async () => {
      render(<StaffDashboard />);
    });
    
    expect(screen.getByText(/StadiaLogix Ops/i)).toBeInTheDocument();
    expect(screen.getByText(/Digital Twin Command Center/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-stadium-map')).toBeInTheDocument();
  });
});
