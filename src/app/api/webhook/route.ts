// This file is no longer used and can be safely deleted.
// The new approach calls the n8n workflow synchronously and gets the result directly.
import {NextRequest, NextResponse} from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'This endpoint is no longer in use.'
  }, { status: 410 }); // 410 Gone
}
