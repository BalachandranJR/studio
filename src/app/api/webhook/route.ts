
import { NextRequest, NextResponse } from 'next/server';
import { ItinerarySchema, Itinerary } from '@/lib/types';
import { z } from 'zod';
import { unstable_noStore as noStore, unstable_cache as cache } from 'next/cache';

// This is a simple in-memory cache that leverages Next.js's caching capabilities
// to be more persistent across serverless function invocations than a simple Map.
// We are essentially "tagging" each cache entry with the session ID.

const getCachedResult = cache(
    async (sessionId: string) => {
        // This function body will only be executed if the result for this sessionId is not in the cache.
        // Since we don't have a database to fetch from, we just return a "pending" status.
        // The real value is set by the `revalidateTag` call in the POST handler.
        return { status: 'pending' };
    },
    ['itinerary-results'], // Cache key prefix
    {
        tags: ['itinerary-tag'], // Use session-specific tags
    }
);

// We need a way to store the actual data. A simple Map on the global scope
// works better in Next.js than a request-scoped one.
// While not guaranteed to persist across all serverless instances, it's more
// reliable than a locally scoped variable.
const resultStore: Map<string, { itinerary?: Itinerary; error?: string }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes


// Ensure this endpoint is not cached by default and is treated as dynamic.
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  noStore(); // Opt out of caching for this function
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    console.error('[Webhook] POST Error: No sessionId provided.');
    return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
  }

  console.log(`[Webhook] Received POST for sessionId: ${sessionId}`);

  try {
    const body = await request.json();
    console.log(`[Webhook] Raw payload for ${sessionId}:`, JSON.stringify(body, null, 2));

    let dataToCache: { itinerary?: Itinerary; error?: string };

    if (body.error) {
       console.error(`[Webhook] n8n workflow returned an error for session ${sessionId}:`, body.error);
       const errorMessage = typeof body.error === 'object' ? JSON.stringify(body.error) : body.error;
       dataToCache = { error: `An error occurred in the n8n workflow: ${errorMessage}` };
    } else {
        const itineraryData = body.itinerary;
        if (!itineraryData) {
            throw new Error("Payload from n8n is missing the 'itinerary' object.");
        }
        const validatedItinerary = ItinerarySchema.parse(itineraryData);
        dataToCache = { itinerary: validatedItinerary };
    }

    console.log(`[Webhook] Successfully processed data for sessionId: ${sessionId}, storing in cache.`);
    resultStore.set(sessionId, dataToCache);
    
    // Clean up cache entry after TTL
    setTimeout(() => {
        resultStore.delete(sessionId);
        console.log(`[Webhook] Cleared cache for expired sessionId: ${sessionId}`);
    }, CACHE_TTL);


    return NextResponse.json({ success: true, message: "Data received and processed." });
  } catch (error) {
    console.error(`[Webhook] Processing error for session ${sessionId}:`, error);
    
    let errorMessage = 'Invalid itinerary data received.';
    if (error instanceof z.ZodError) {
      errorMessage = "The itinerary data from the workflow has an invalid format. Check server logs for details.";
      console.error("[Webhook] Zod validation failed. Details:", JSON.stringify(error.flatten(), null, 2));
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    resultStore.set(sessionId, { error: errorMessage });

    return NextResponse.json({ success: false, error: 'Failed to process webhook data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  noStore(); // Opt out of caching for this function
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  console.log(`[Webhook] Received GET (poll) for sessionId: ${sessionId}`);

  const result = resultStore.get(sessionId);

  if (result) {
    console.log(`[Webhook] Found result in cache for ${sessionId}, returning it.`);
    return NextResponse.json(result);
  } else {
    console.log(`[Webhook] No result in cache for ${sessionId} yet.`);
    return NextResponse.json({ status: 'pending' });
  }
}
