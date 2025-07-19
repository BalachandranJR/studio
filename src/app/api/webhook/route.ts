
import { Itinerary, ItinerarySchema } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { unstable_noStore as noStore } from 'next/cache';
import { resultStore } from '@/lib/cache';

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
      // The entire body is the itinerary object from the n8n workflow.
      // We parse the body directly, not a nested property.
      const validatedItinerary = ItinerarySchema.parse(body);
      dataToCache = { itinerary: validatedItinerary };
      console.log(`[Webhook] Successfully validated itinerary for sessionId: ${sessionId}, storing in cache.`);
    }

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
    resultStore.set(sessionId, errorToCache);

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

  const result = resultStore.get(sessionId);

  if (result) {
    console.log(`[Webhook] Found result in cache for ${sessionId}, returning it.`);
    // To prevent memory leaks on long-running servers, we can remove the entry after retrieval.
    // However, for polling, the client might ask again. A TTL strategy is better.
    // For now, we'll leave it and rely on server restarts to clear memory.
    // In a more robust solution, a TTL cleanup would be added to the cache module.
    return NextResponse.json(result);
  } else {
    console.log(`[Webhook] No result in cache for ${sessionId} yet.`);
    return NextResponse.json({ status: 'pending' });
  }
}
