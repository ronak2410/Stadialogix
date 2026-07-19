import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let timeRemaining1 = 12 * 60; // 12 mins in seconds
      let timeRemaining2 = 28 * 60; // 28 mins in seconds
      
      const interval = setInterval(() => {
        timeRemaining1 -= 1;
        timeRemaining2 -= 1;

        if (timeRemaining1 <= 0) timeRemaining1 = 45 * 60;
        if (timeRemaining2 <= 0) timeRemaining2 = 60 * 60;

        const transitData = [
          { line: 'NJ Transit Line 1', destination: 'Secaucus Junction', mins: Math.floor(timeRemaining1 / 60), status: 'On Time', color: 'text-emerald-400' },
          { line: 'NJ Transit Line 2', destination: 'Hoboken Terminal', mins: Math.floor(timeRemaining2 / 60), status: 'Delayed', color: 'text-amber-400' }
        ];

        const data = `data: ${JSON.stringify(transitData)}\n\n`;
        
        try {
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          clearInterval(interval);
        }
      }, 1000); // Tick every 1 second (simulates real time decaying)

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
