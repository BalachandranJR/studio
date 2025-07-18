// This file is no longer used by the application and can be safely deleted.
// The polling mechanism in /api/webhook and the frontend replaces this.
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json(
        { message: 'This streaming endpoint is deprecated. Use the polling mechanism via /api/webhook.' },
        { status: 410 } // 410 Gone
    );
}
