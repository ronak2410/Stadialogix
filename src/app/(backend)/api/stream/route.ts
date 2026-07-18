import { NextRequest } from 'next/server';
import stadiumData from '@/data/stadium_data.json';
import { StadiumNode } from '@/types';

// Force dynamic execution for SSE
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const nodes = (stadiumData as any).nodes as StadiumNode[];

  // State for Queueing Theory (Little's Law) simulation
  let simState = nodes.map(node => ({
    id: node.id,
    density: node.crowdDensity || Math.random() * 50 + 10,
    arrivalRate: Math.random() * 15 + 5, 
    serviceRate: node.type === 'gate' ? 25 : 15,
  }));

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      const interval = setInterval(() => {
        // Organic fluctuation using random walk and queueing theory
        simState = simState.map(state => {
          // Arrival rate fluctuates naturally
          state.arrivalRate = Math.max(2, state.arrivalRate + (Math.random() - 0.5) * 8);
          
          // If arrival > service, queue grows (density goes up)
          const netChange = (state.arrivalRate - state.serviceRate) * 0.2; 
          
          let newDensity = state.density + netChange;
          // Soft bounds
          if (newDensity < 5) newDensity = 5;
          if (newDensity > 99) newDensity = 99;

          return { ...state, density: newDensity };
        });

        const updatePayload = simState.map(s => ({
          id: s.id,
          density: Math.round(s.density),
          estimatedWaitTime: Math.round(s.density / 4) // Queue calculation
        }));

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'iot_update', data: updatePayload })}\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 3000); // Push every 3 seconds

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
