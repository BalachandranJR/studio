
import type { Itinerary } from './types';

// In-memory store for itineraries and listeners. 
// In a real app, use a database or a pub/sub system (e.g., Redis, Firestore, etc.)
const itineraryCache = new Map<string, Itinerary>();
const listeners = new Map<string, (data: Itinerary) => void>();

/**
 * Subscribes a client to wait for an itinerary for a specific session.
 * If the itinerary is already available, it sends it immediately.
 * @param sessionId The unique ID for the travel planning session.
 * @param callback The function to call when the itinerary is ready.
 */
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

/**
 * Unsubscribes a client from listening for an itinerary.
 * This is called when the client disconnects.
 * @param sessionId The unique ID for the travel planning session.
 */
export function unsubscribeFromItinerary(sessionId: string) {
  listeners.delete(sessionId);
}

/**
 * Called by the webhook when a new itinerary is received from n8n.
 * It either sends the data to a waiting client or caches it.
 * @param sessionId The unique ID for the travel planning session.
 * @param itinerary The itinerary data received from n8n.
 */
export function notifyItineraryReady(sessionId: string, itinerary: Itinerary) {
   // Check if there is a listener waiting for this itinerary
    if (listeners.has(sessionId)) {
      const listener = listeners.get(sessionId)!;
      listener(itinerary); // Send data to the waiting client
      listeners.delete(sessionId); // Remove the listener
    } else {
      // If no listener is present (e.g., webhook was faster than client connecting),
      // cache the itinerary for a short time.
      itineraryCache.set(sessionId, itinerary);
      // Clean up the cache after 5 minutes to prevent memory leaks
      setTimeout(() => itineraryCache.delete(sessionId), 5 * 60 * 1000); 
    }
}
