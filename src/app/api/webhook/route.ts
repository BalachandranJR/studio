
// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ItinerarySchema, Itinerary } from '@/lib/types';
import { z } from 'zod';

// This is a simple in-memory cache. In a real-world serverless environment,
// you would use a more persistent cache like Redis, Vercel KV, or a database.
const resultCache = new Map<string, { itinerary?: Itinerary; error?: string }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Ensure this endpoint is not cached by default and is treated as dynamic.
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    if (body.error) {
       console.error(`[Webhook] n8n workflow returned an error for session ${sessionId}:`, body.error);
       const errorMessage = typeof body.error === 'object' ? JSON.stringify(body.error) : body.error;
       resultCache.set(sessionId, { error: `An error occurred in the n8n workflow: ${errorMessage}` });
       return NextResponse.json({ success: true, message: "Error notification received and processed." });
    }

    // Explicitly check for the nested itinerary object, which is what n8n sends.
    const itineraryData = body.itinerary;
    if (!itineraryData) {
        throw new Error("Payload from n8n is missing the 'itinerary' object.");
    }
    
    const validatedItinerary = ItinerarySchema.parse(itineraryData);

    console.log(`[Webhook] Successfully validated itinerary for sessionId: ${sessionId}, storing in cache.`);
    resultCache.set(sessionId, { itinerary: validatedItinerary });

    // Clean up cache entry after TTL
    setTimeout(() => {
        resultCache.delete(sessionId);
        console.log(`[Webhook] Cleared cache for expired sessionId: ${sessionId}`);
    }, CACHE_TTL);

    return NextResponse.json({ success: true, message: "Itinerary received and processed." });
  } catch (error) {
    console.error(`[Webhook] Processing error for session ${sessionId}:`, error);
    
    let errorMessage = 'Invalid itinerary data received.';
    if (error instanceof z.ZodError) {
      // Provide detailed validation error logging
      errorMessage = "The itinerary data from the workflow has an invalid format. Check server logs for details.";
      console.error("[Webhook] Zod validation failed. Details:", JSON.stringify(error.flatten(), null, 2));
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    resultCache.set(sessionId, { error: errorMessage });

    return NextResponse.json({ success: false, error: 'Failed to process webhook data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  console.log(`[Webhook] Received GET (poll) for sessionId: ${sessionId}`);

  const result = resultCache.get(sessionId);

  if (result) {
    console.log(`[Webhook] Found result in cache for ${sessionId}, returning it.`);
    // We can remove it from the cache after the first successful poll
    // to prevent multiple reads, but let's keep it for now for robustness.
    return NextResponse.json(result);
  } else {
    console.log(`[Webhook] No result in cache for ${sessionId} yet.`);
    return NextResponse.json({ status: 'pending' });
  }
}
