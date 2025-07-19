
import { kv } from '@/lib/kv';
import { Itinerary, ItinerarySchema } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { unstable_noStore as noStore } from 'next/cache';

const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes in seconds

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  noStore();
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

    // Use Vercel KV to store the result with a Time-To-Live (TTL)
    await kv.set(sessionId, JSON.stringify(dataToCache), { ex: CACHE_TTL_SECONDS });
    
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
    
    // Store the error in KV so the frontend can retrieve it
    await kv.set(sessionId, JSON.stringify({ error: errorMessage }), { ex: CACHE_TTL_SECONDS });

    return NextResponse.json({ success: false, error: 'Failed to process webhook data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  noStore();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  console.log(`[Webhook] Received GET (poll) for sessionId: ${sessionId}`);

  // Retrieve the result from Vercel KV
  const result = await kv.get<{ itinerary?: Itinerary; error?: string }>(sessionId);

  if (result) {
    console.log(`[Webhook] Found result in cache for ${sessionId}, returning it.`);
    return NextResponse.json(result);
  } else {
    console.log(`[Webhook] No result in cache for ${sessionId} yet.`);
    return NextResponse.json({ status: 'pending' });
  }
}
