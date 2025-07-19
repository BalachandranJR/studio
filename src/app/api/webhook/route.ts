
import type { Itinerary } from '@/lib/types';
import { ItinerarySchema } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { unstable_noStore as noStore } from 'next/cache';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const getCacheFilePath = (sessionId: string) => {
    // IMPORTANT: Use the /tmp directory for temporary file storage in serverless environments
    return path.join(os.tmpdir(), `${sessionId}.json`);
};

export async function POST(request: NextRequest) {
  noStore();
  
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    console.error('[Webhook] POST Error: No sessionId provided.');
    return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
  }

  console.log(`[Webhook] Received POST for sessionId: ${sessionId}`);
  const cacheFilePath = getCacheFilePath(sessionId);

  try {
    const body = await request.json();
    console.log(`[Webhook] Raw payload for ${sessionId}:`, JSON.stringify(body, null, 2));

    let dataToCache: { itinerary?: Itinerary; error?: string };

    if (body.error) {
      console.error(`[Webhook] n8n workflow returned an error for session ${sessionId}:`, body.error);
      const errorMessage = typeof body.error === 'object' ? JSON.stringify(body.error) : body.error;
      dataToCache = { error: `An error occurred in the n8n workflow: ${errorMessage}` };
    } else {
      if (!body.itinerary) {
          throw new Error("Payload from n8n is missing the 'itinerary' object.");
      }

      const validatedItinerary = ItinerarySchema.parse(body.itinerary);
      dataToCache = { itinerary: validatedItinerary };
      console.log(`[Webhook] Successfully validated itinerary for sessionId: ${sessionId}, writing to file cache.`);
    }

    await fs.writeFile(cacheFilePath, JSON.stringify(dataToCache));
    
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
    
    const errorToCache = { error: errorMessage };
    try {
        await fs.writeFile(cacheFilePath, JSON.stringify(errorToCache));
    } catch (writeError) {
        console.error(`[Webhook] FATAL: Could not write error to cache for session ${sessionId}:`, writeError);
    }

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
  const cacheFilePath = getCacheFilePath(sessionId);

  try {
    const fileContent = await fs.readFile(cacheFilePath, 'utf-8');
    const result = JSON.parse(fileContent);
    console.log(`[Webhook] Found result in file cache for ${sessionId}, returning it.`);
    // Optionally, delete the file after reading to clean up
    await fs.unlink(cacheFilePath).catch(err => console.error(`[Webhook] Failed to unlink cache file for ${sessionId}:`, err));
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
        console.log(`[Webhook] No result in file cache for ${sessionId} yet.`);
        return NextResponse.json({ status: 'pending' });
    } else {
        console.error(`[Webhook] Error reading cache file for ${sessionId}:`, error);
        return NextResponse.json({ error: 'Failed to read result from cache' }, { status: 500 });
    }
  }
}
