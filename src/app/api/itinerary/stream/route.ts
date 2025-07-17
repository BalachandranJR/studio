
// This file is no longer used in the polling architecture.
// It can be safely deleted, but we will leave it for now.

import {NextResponse} from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'This endpoint is not used in the polling architecture.'
  }, { status: 404 });
}
