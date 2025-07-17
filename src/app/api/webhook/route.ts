
import {NextRequest, NextResponse} from 'next/server';
import { completeItinerary } from '@/app/actions';

// This endpoint is now called by n8n when the workflow is complete.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // The sessionId and the final itinerary should be in the body
    // that n8n POSTs back to this endpoint.
    const { sessionId, ...result } = body;

    if (!sessionId) {
      return NextResponse.json({success: false, error: 'Session ID is required in the callback payload'}, {status: 400});
    }

    // Pass the data to the server action to update the status in our in-memory store.
    const updateResult = await completeItinerary(sessionId, result);

    if (updateResult.success) {
      return NextResponse.json({success: true});
    } else {
      return NextResponse.json({success: false, error: updateResult.error}, {status: 500});
    }
    
  } catch (error) {
    console.error(`Error processing webhook:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({success: false, error: errorMessage}, {status: 500});
  }
}
