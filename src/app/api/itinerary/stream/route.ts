
import {NextRequest} from 'next/server';
import {subscribeToItinerary, unsubscribeFromItinerary} from '@/lib/itinerary-events';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Session ID is required', {status: 400});
  }
  
  const stream = new ReadableStream({
    start(controller) {
      let intervalId: NodeJS.Timeout | null = null;

      const handleItinerary = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        if (intervalId) {
          clearInterval(intervalId);
        }
        controller.close(); 
        unsubscribeFromItinerary(sessionId);
      };

      // Subscribe to get the itinerary when it's ready
      subscribeToItinerary(sessionId, handleItinerary);

      // Keep-alive mechanism to prevent timeouts
      intervalId = setInterval(() => {
        // Send a comment to keep the connection alive
        controller.enqueue(': keep-alive\n\n');
      }, 20000); // every 20 seconds

      // Handle client disconnection
      request.signal.addEventListener('abort', () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        unsubscribeFromItinerary(sessionId);
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
