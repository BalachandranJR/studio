// This file is no longer used by the application and can be safely deleted.
// The application now uses a direct-fetch model where the server action
// calls the n8n workflow and waits for the response directly.
// This simplifies the architecture and makes it more reliable in a serverless environment.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "This endpoint is no longer in use." }, { status: 410 });
}

export async function POST() {
    return NextResponse.json({ message: "This endpoint is no longer in use." }, { status: 410 });
}
