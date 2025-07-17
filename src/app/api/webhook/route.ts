// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ItinerarySchema } from '@/lib/types';
import { notifyListeners } from '@/lib/itinerary-events';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    if (body.error) {
       console.error(`n8n workflow error for session ${sessionId}:`, body.message);
       notifyListeners(sessionId, { error: body.message || 'An error occurred in the workflow.' });
       return NextResponse.json({ success: true, message: "Error notification received." });
    }

    // The n8n workflow might nest the final result.
    const itineraryData = body.itinerary || body;
    const validatedItinerary = ItinerarySchema.parse(itineraryData);

    notifyListeners(sessionId, { itinerary: validatedItinerary });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Webhook error for session ${sessionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Invalid itinerary data received.';
    notifyListeners(sessionId, { error: errorMessage });

    return NextResponse.json({ success: false, error: 'Failed to process webhook data' }, { status: 500 });
  }
}
