
import {NextRequest} from 'next/server';
import {subscribeToItinerary, unsubscribeFromItinerary} from '@/app/api/webhook/route';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Session ID is required', {status: 400});
  }
  
  const stream = new ReadableStream({
    start(controller) {
      const handleItinerary = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        controller.close(); // Close the connection after sending the data
        unsubscribeFromItinerary(sessionId);
      };

      // Subscribe to get the itinerary when it's ready
      subscribeToItinerary(sessionId, handleItinerary);

      // Handle client disconnection
      request.signal.addEventListener('abort', () => {
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
