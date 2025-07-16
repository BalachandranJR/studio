
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {ItinerarySchema, Itinerary} from '@/lib/types';

// In-memory store for itineraries. In a real app, use a database (e.g., Firestore, Redis, etc.)
const itineraryCache = new Map<string, Itinerary>();
const listeners = new Map<string, (data: Itinerary) => void>();

// This function will be called by our SSE route to wait for an itinerary
export function subscribeToItinerary(sessionId: string, callback: (data: Itinerary) => void) {
  // If the itinerary is already in the cache, send it immediately
  if (itineraryCache.has(sessionId)) {
    const itinerary = itineraryCache.get(sessionId)!;
    callback(itinerary);
    itineraryCache.delete(sessionId); // Clean up the cache
    return;
  }
  
  // Otherwise, store the listener to be called when the itinerary arrives
  listeners.set(sessionId, callback);
}

// Function to remove a listener if the client disconnects
export function unsubscribeFromItinerary(sessionId: string) {
  listeners.delete(sessionId);
}

export async function POST(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({success: false, error: 'Session ID is required'}, {status: 400});
  }

  try {
    const json = await request.json();
    console.log(`Received itinerary for session ${sessionId}:`, JSON.stringify(json, null, 2));
    
    const validation = ItinerarySchema.safeParse(json);

    if (!validation.success) {
      console.error('Invalid itinerary data received from n8n:', validation.error.issues);
      // In a real app, you might want to notify the client of the error
      return NextResponse.json({success: false, error: 'Invalid data format'}, {status: 400});
    }

    const itinerary = validation.data;

    // Check if there is a listener waiting for this itinerary
    if (listeners.has(sessionId)) {
      const listener = listeners.get(sessionId)!;
      listener(itinerary); // Send data to the waiting client
      listeners.delete(sessionId); // Remove the listener
    } else {
      // If no listener is present, cache the itinerary for a short time
      itineraryCache.set(sessionId, itinerary);
      // Clean up the cache after 5 minutes to prevent memory leaks
      setTimeout(() => itineraryCache.delete(sessionId), 5 * 60 * 1000); 
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error(`Error processing webhook for session ${sessionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({success: false, error: errorMessage}, {status: 500});
  }
}
