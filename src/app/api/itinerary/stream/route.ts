// This file is no longer used and can be safely deleted.
// The new approach calls the n8n workflow synchronously from a Server Action.
import {NextResponse} from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'This endpoint is no longer in use.'
  }, { status: 410 }); // 410 Gone
}
