// src/lib/itinerary-events.ts
import type { Itinerary } from './types';

type Listener = (data: { itinerary?: Itinerary; error?: string }) => void;

// A simple in-memory store for listeners.
// In a serverless environment, this state is not shared across different function instances.
// This works on the assumption that for a single user journey, Vercel will likely route
// the initial stream request and the subsequent webhook call to the same running instance.
const listeners = new Map<string, Set<Listener>>();

export function addListener(sessionId: string, listener: Listener) {
  if (!listeners.has(sessionId)) {
    listeners.set(sessionId, new Set());
  }
  const sessionListeners = listeners.get(sessionId)!;
  console.log(`[Events] Listener added for sessionId: ${sessionId}. Total listeners for session: ${sessionListeners.size + 1}`);
  sessionListeners.add(listener);
}

export function removeListener(sessionId: string, listener: Listener) {
  const sessionListeners = listeners.get(sessionId);
  if (sessionListeners) {
    sessionListeners.delete(listener);
    console.log(`[Events] Listener removed for sessionId: ${sessionId}. Remaining listeners: ${sessionListeners.size}`);
    if (sessionListeners.size === 0) {
      listeners.delete(sessionId);
      console.log(`[Events] All listeners for sessionId: ${sessionId} removed. Deleting session.`);
    }
  }
}

export function notifyListeners(sessionId: string, data: { itinerary?: Itinerary; error?: string }) {
  const sessionListeners = listeners.get(sessionId);
  if (sessionListeners && sessionListeners.size > 0) {
    console.log(`[Events] Notifying ${sessionListeners.size} listeners for sessionId: ${sessionId}`);
    // Create a copy of the listeners to iterate over, in case a listener modifies the set.
    const listenersToNotify = Array.from(sessionListeners);
    for (const listener of listenersToNotify) {
      try {
        listener(data);
      } catch (e) {
        console.error(`[Events] Error calling listener for sessionId ${sessionId}:`, e);
      }
    }
    // Listeners are now one-time use. Clean up immediately after notifying.
    listeners.delete(sessionId);
    console.log(`[Events] Notified and cleaned up all listeners for sessionId: ${sessionId}`);
  } else {
    console.warn(`[Events] No listeners found for sessionId: ${sessionId} to notify.`);
  }
}
