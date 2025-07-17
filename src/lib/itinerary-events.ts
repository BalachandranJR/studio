// src/lib/itinerary-events.ts
import type { Itinerary } from './types';

type Listener = (data: { itinerary?: Itinerary; error?: string }) => void;
const listeners = new Map<string, Set<Listener>>();

export function addListener(sessionId: string, listener: Listener) {
  if (!listeners.has(sessionId)) {
    listeners.set(sessionId, new Set());
  }
  listeners.get(sessionId)!.add(listener);
}

export function removeListener(sessionId: string, listener: Listener) {
  const sessionListeners = listeners.get(sessionId);
  if (sessionListeners) {
    sessionListeners.delete(listener);
    if (sessionListeners.size === 0) {
      listeners.delete(sessionId);
    }
  }
}

export function notifyListeners(sessionId: string, data: { itinerary?: Itinerary; error?: string }) {
  const sessionListeners = listeners.get(sessionId);
  if (sessionListeners) {
    sessionListeners.forEach(listener => listener(data));
    // Clean up listeners after a short delay to prevent race conditions
    // where the client disconnects before receiving the message.
    setTimeout(() => {
        listeners.delete(sessionId);
    }, 1000);
  }
}
