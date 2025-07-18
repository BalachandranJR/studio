
import { NextRequest, NextResponse } from 'next/server';
import { ItinerarySchema, Itinerary } from '@/lib/types';
import { z } from 'zod';
import { unstable_noStore as noStore } from 'next/cache';

// This is a more robust way to handle in-memory cache in a serverless environment like Vercel.
// It attaches the cache to the global object, which can persist between "warm" function invocations.
const globalForCache = globalThis as unknown as {
  resultCache: Map<string, { itinerary?: Itinerary; error?: string }> | undefined;
};

const resultStore = globalForCache.resultCache ?? new Map<string, { itinerary?: Itinerary; error?: string }>();
if (process.env.NODE_ENV !== 'production') globalForCache.resultCache = resultStore;


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
        // The itinerary is now nested inside an 'itinerary' object in the payload
        const itineraryData = body.itinerary;
        if (!itineraryData) {
            throw new Error("Payload from n8n is missing the 'itinerary' object.");
        }
        
        const validatedItinerary = ItinerarySchema.parse(itineraryData);
        dataToCache = { itinerary: validatedItinerary };
        console.log(`[Webhook] Successfully validated itinerary for sessionId: ${sessionId}, storing in cache.`);
    }

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
