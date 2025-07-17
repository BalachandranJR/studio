// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ItinerarySchema } from '@/lib/types';
import { notifyListeners } from '@/lib/itinerary-events';
import { z } from 'zod';

export const dynamic = 'force-dynamic'; // This is the important change

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    console.error('Webhook Error: No sessionId provided in query parameters.');
    return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
  }

  console.log(`Webhook received for sessionId: ${sessionId}`);

  try {
    const body = await request.json();
    console.log(`Webhook payload for ${sessionId}:`, JSON.stringify(body, null, 2));
    
    if (body.error) {
       console.error(`n8n workflow error for session ${sessionId}:`, body.message);
       notifyListeners(sessionId, { error: body.message || 'An error occurred in the n8n workflow.' });
       return NextResponse.json({ success: true, message: "Error notification received and processed." });
    }

    // The n8n workflow might nest the final result. Adapt this as needed.
    const itineraryData = body.itinerary || body;
    const validatedItinerary = ItinerarySchema.parse(itineraryData);

    console.log(`Successfully validated itinerary for sessionId: ${sessionId}`);
    notifyListeners(sessionId, { itinerary: validatedItinerary });

    return NextResponse.json({ success: true, message: "Itinerary received and processed." });
  } catch (error) {
    console.error(`Webhook processing error for session ${sessionId}:`, error);
    
    let errorMessage = 'Invalid itinerary data received.';
    if (error instanceof z.ZodError) {
      errorMessage = "The itinerary data from the workflow has an invalid format.";
      console.error("Zod validation details:", error.flatten());
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    notifyListeners(sessionId, { error: errorMessage });

    return NextResponse.json({ success: false, error: 'Failed to process webhook data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  return NextResponse.json({
    message: 'Webhook endpoint is active and reachable.',
    usage: 'This endpoint expects a POST request from the n8n workflow.',
    sessionIdProvided: sessionId || 'none',
    timestamp: new Date().toISOString()
  });
}
