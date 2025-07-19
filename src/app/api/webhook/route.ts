
import { Itinerary, ItinerarySchema } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { unstable_noStore as noStore } from 'next/cache';

// WARNING: This is an in-memory store.
// It will not persist across different serverless function instances.
// This may lead to silent timeouts if the POST and GET requests are handled
// by different instances, which is common in production environments.
const resultStore = new Map<string, { itinerary?: Itinerary; error?: string }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export const dynamic = 'force-dynamic';

function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, value] of resultStore.entries()) {
        // A bit of a hack: storing expiry time on the value object
        const expiry = (value as any).expiry;
        if (expiry && now > expiry) {
            resultStore.delete(key);
            console.log(`[Webhook] Cleaned up expired session: ${key}`);
        }
    }
}


export async function POST(request: NextRequest) {
  noStore();
  cleanupExpiredEntries();

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
      console.log(`[Webhook] Successfully validated itinerary for sessionId: ${sessionId}, storing in cache.`);
    }

    // Add expiry timestamp to the data before storing
    (dataToCache as any).expiry = Date.now() + CACHE_TTL_MS;
    resultStore.set(sessionId, dataToCache);
    
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
    
    // Store the error in the map so the frontend can retrieve it
    const errorToCache = { error: errorMessage };
    (errorToCache as any).expiry = Date.now() + CACHE_TTL_MS;
    resultStore.set(sessionId, errorToCache);

    return NextResponse.json({ success: false, error: 'Failed to process webhook data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  noStore();
  cleanupExpiredEntries();
  
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  console.log(`[Webhook] Received GET (poll) for sessionId: ${sessionId}`);

  const result = resultStore.get(sessionId);

  if (result) {
    console.log(`[Webhook] Found result in cache for ${sessionId}, returning it.`);
    // We don't want to delete it immediately, as polling might happen multiple times
    // The cleanup will handle removal after TTL
    return NextResponse.json(result);
  } else {
    console.log(`[Webhook] No result in cache for ${sessionId} yet.`);
    return NextResponse.json({ status: 'pending' });
  }
}
