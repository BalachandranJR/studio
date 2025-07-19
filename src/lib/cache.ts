
import type { Itinerary } from './types';

/**
 * A shared, in-memory cache for storing itinerary results.
 * By defining the Map in its own module, we ensure that all parts of the app
 * that import it will share the same instance, as long as they are running
 * in the same Node.js process. This is more reliable on serverless platforms
 * than using `globalThis`, though it's not guaranteed to persist across
 * all scaling scenarios.
 * 
 * The key is the `sessionId` (string), and the value is the result object.
 */
export const resultStore = new Map<string, { itinerary?: Itinerary; error?: string }>();

// Optional: Add a cleanup mechanism to prevent memory leaks over time.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of resultStore.entries()) {
    // A bit of a hack: storing expiry time on the value object
    const entryTimestamp = (value as any).timestamp || 0;
    if (now - entryTimestamp > CACHE_TTL_MS) {
      resultStore.delete(key);
      console.log(`[Cache] Cleaned up expired session: ${key}`);
    }
  }
}, CACHE_TTL_MS);

// We also need to add a timestamp when setting a value.
const originalSet = resultStore.set.bind(resultStore);
resultStore.set = (key, value) => {
  (value as any).timestamp = Date.now();
  return originalSet(key, value);
};

