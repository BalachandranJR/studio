
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {ItinerarySchema, Itinerary} from '@/lib/types';
import { notifyItineraryReady } from '@/lib/itinerary-events';


export async function POST(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({success: false, error: 'Session ID is required'}, {status: 400});
  }

  try {
    const json = await request.json();
    console.log(`Received itinerary for session ${sessionId}:`, JSON.stringify(json, null, 2));
    
    const validation = ItinerarySchema.safeParse(json);

    if (!validation.success) {
      console.error('Invalid itinerary data received from n8n:', validation.error.issues);
      // In a real app, you might want to notify the client of the error
      return NextResponse.json({success: false, error: 'Invalid data format'}, {status: 400});
    }

    const itinerary = validation.data;
    
    notifyItineraryReady(sessionId, itinerary);
    
    return NextResponse.json({success: true});
  } catch (error) {
    console.error(`Error processing webhook for session ${sessionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({success: false, error: errorMessage}, {status: 500});
  }
}
