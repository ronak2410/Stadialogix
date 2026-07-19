import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let tick = 0;
      
      const interval = setInterval(() => {
        tick++;
        
        // Simulate high-frequency 500Hz ball telemetry data
        const telemetry = {
          speed_kmh: 80 + Math.floor(Math.sin(tick) * 30),
          spin_rpm: 300 + Math.floor(Math.cos(tick) * 50),
          coords: {
            x: 40.8135 + Math.sin(tick/10) * 0.0005,
            y: -74.0744 + Math.cos(tick/10) * 0.0005,
            z: Math.abs(Math.sin(tick/5) * 15)
          }
        };

        const data = `data: ${JSON.stringify(telemetry)}\n\n`;
        
        try {
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          clearInterval(interval);
        }
      }, 500); // 500ms for realistic visualization without overwhelming the browser too much

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
