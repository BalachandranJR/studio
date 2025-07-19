
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ItinerarySchema } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Define the expected schema for the incoming POST request body
const webhookPayloadSchema = z.object({
  itinerary: ItinerarySchema,
  sessionId: z.string().uuid(),
});

const getCacheFilePath = (sessionId: string) => {
  // Use the OS's temporary directory, which is reliable in most serverless environments
  return path.join(os.tmpdir(), `${sessionId}.json`);
};

// Handles POST requests from the n8n workflow
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // The incoming body from n8n might be an array, so we handle that
    const payloadArray = Array.isArray(body) ? body : [body];
    const rawPayload = payloadArray[0];

    if (!rawPayload) {
      return NextResponse.json({ error: 'Empty payload received' }, { status: 400 });
    }
    
    const { itinerary, sessionId } = webhookPayloadSchema.parse(rawPayload);

    console.log(`[Webhook] Successfully validated itinerary for sessionId: ${sessionId}, writing to file cache.`);
    
    const filePath = getCacheFilePath(sessionId);
    await fs.writeFile(filePath, JSON.stringify({ itinerary }));

    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Webhook] Validation error:', error.flatten());
      return NextResponse.json({ error: 'Invalid payload structure.', details: error.flatten() }, { status: 400 });
    }
    console.error('[Webhook] Internal server error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}


// Handles GET requests from the frontend polling client
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
  }

  try {
    const filePath = getCacheFilePath(sessionId);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const result = JSON.parse(data);
      
      // Optional: Clean up the file after it's been read to save space
      // await fs.unlink(filePath);
      
      console.log(`[Webhook] Result found for ${sessionId}, returning to client.`);
      return NextResponse.json(result);
    } catch (e) {
      // This is the expected case when the file doesn't exist yet
      console.log(`[Webhook] No result in file cache for ${sessionId} yet.`);
      return NextResponse.json({ itinerary: null, error: null });
    }

  } catch (error) {
    console.error(`[Webhook] Error fetching result for ${sessionId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch result.' }, { status: 500 });
  }
}
