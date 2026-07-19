import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send an initial payload
      let tick = 0;
      
      const interval = setInterval(() => {
        tick++;
        
        // Generate simulated dynamic state for IoT sensors
        const dynamicState = {
          nodes: [
            { id: 'gate-verizon', name: 'Verizon Gate', type: 'gate', waitTimeMin: Math.floor(Math.random() * 20), status: tick % 5 === 0 ? 'warning' : 'nominal' },
            { id: 'sec-100', name: 'Section 100', type: 'seating', crowdDensity: 40 + Math.floor(Math.random() * 40) },
            { id: 'vendor-pizza-1', name: 'Luigi\'s Pizza', type: 'vendor', waitTimeMin: Math.floor(Math.random() * 15) },
            // Introduce a crowd crush scenario dynamically at concourse-east every few ticks
            { id: 'waypoint-concourse-east', name: 'East Concourse', type: 'logistics', crowdDensity: tick % 10 < 3 ? 85 + Math.floor(Math.random() * 10) : 40 },
          ]
        };

        const data = `data: ${JSON.stringify(dynamicState)}\n\n`;
        
        try {
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          clearInterval(interval);
        }
      }, 3000); // Send updates every 3 seconds

      // Cleanup when connection closes
      return () => clearInterval(interval);
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
