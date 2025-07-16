
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {ItinerarySchema} from '@/lib/types';

// This is the endpoint that n8n will call when the itinerary is ready.
// In a real application, you would save this data to a database (e.g., Firestore)
// and associate it with the user who requested it.
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    console.log('Received itinerary from n8n webhook:', JSON.stringify(json, null, 2));

    // Optional: Validate the data received from n8n to ensure it's correct
    const validation = ItinerarySchema.safeParse(json);

    if (!validation.success) {
      console.error('Invalid itinerary data received from n8n:', validation.error.issues);
      return NextResponse.json({success: false, error: 'Invalid data format'}, {status: 400});
    }
    
    // Here, you would save `validation.data` to your database.
    // For now, we'll just log it and return success.

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({success: false, error: errorMessage}, {status: 500});
  }
}
