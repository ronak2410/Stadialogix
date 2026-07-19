import { NextRequest } from 'next/server';
import { getIoTState } from '@/utils/iotState';
import { getLiveMatchState } from '@/utils/matchState';

// Force dynamic execution for SSE
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  let isStreamActive = true;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial state immediately
      try {
        const currentState = getIoTState();
        const matchState = getLiveMatchState();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          nodes: currentState.nodes,
          flashSales: currentState.flashSales || [],
          match: matchState
        })}\n\n`));
      } catch (err) {
        console.error("Initial stream encode error", err);
      }

      // Continuous data streaming (Zero Mocks)
      const timer = setInterval(() => {
        if (isStreamActive) {
          try {
            const currentState = getIoTState();
            const matchState = getLiveMatchState();
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              nodes: currentState.nodes,
              flashSales: currentState.flashSales || [],
              match: matchState
            })}\n\n`));
          } catch (err) {
            console.error("Stream encode error", err);
          }
        }
      }, 3000); // Push every 3 seconds

      req.signal.addEventListener('abort', () => {
        isStreamActive = false;
        clearInterval(timer);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
