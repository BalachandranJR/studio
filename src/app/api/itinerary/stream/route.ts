// src/app/api/itinerary/stream/route.ts
import { NextRequest } from 'next/server';
import { addListener, removeListener } from '@/lib/itinerary-events';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Session ID is required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const handleEvent = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      addListener(sessionId, handleEvent);

      // Keep-alive mechanism to prevent timeouts on Vercel or other platforms
      const keepAliveInterval = setInterval(() => {
        // Send a comment to keep the connection alive
        controller.enqueue(': keep-alive\n\n');
      }, 20000); // Send a comment every 20 seconds

      request.signal.addEventListener('abort', () => {
        removeListener(sessionId, handleEvent);
        clearInterval(keepAliveInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
