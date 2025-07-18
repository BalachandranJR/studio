// src/app/api/itinerary/stream/route.ts
import { NextRequest } from 'next/server';
import { addListener, removeListener } from '@/lib/itinerary-events';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Session ID is required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      console.log(`[Stream] Connection opened for sessionId: ${sessionId}`);

      const handleEvent = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          console.log(`[Stream] Enqueuing data for sessionId ${sessionId}:`, message);
          controller.enqueue(message);
          // After sending the data, we can close the connection.
          controller.close();
        } catch (e) {
            console.error(`[Stream] Failed to enqueue data for sessionId ${sessionId}:`, e);
        }
      };

      addListener(sessionId, handleEvent);

      // This is a safety timer. If no data is received from the webhook
      // within a certain time, close the connection to prevent it from hanging.
      const safetyTimeout = setTimeout(() => {
        console.warn(`[Stream] Safety timeout reached for sessionId: ${sessionId}. Closing connection.`);
        controller.close();
        // The abort signal below will handle listener removal.
      }, 180000); // 3 minutes timeout

      // When the client disconnects (e.g., closes the browser tab)
      request.signal.addEventListener('abort', () => {
        console.log(`[Stream] Client disconnected for sessionId: ${sessionId}. Cleaning up.`);
        removeListener(sessionId, handleEvent);
        clearTimeout(safetyTimeout);
        // No need to call controller.close() here as the stream is already aborted.
      });
    },
    cancel() {
        console.log("[Stream] Stream canceled by the system.");
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
