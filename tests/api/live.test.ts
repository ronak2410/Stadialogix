import { describe, it, expect } from 'vitest';
import { GET } from '@/app/(backend)/api/live/route';

describe('Live API Route', () => {
  it('returns live stadium data and match scores', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('match');
    expect(data.match.team1).toBe('USA');
    expect(data.match.team2).toBe('Mexico');
  });
});
