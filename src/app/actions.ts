
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { ItinerarySchema, travelPreferenceSchema } from '@/lib/types';
import type { Itinerary } from '@/lib/types';

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error('CRITICAL: NEXT_PUBLIC_APP_URL is not set. Using fallback for local dev.');
    return 'http://localhost:9002';
  }
  return appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
}

const actionSchema = travelPreferenceSchema.extend({
  dates: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format"),
  })
});

export type PollResult = {
    itinerary?: Itinerary;
    error?: string;
};

export async function generateItinerary(
  data: z.infer<typeof actionSchema>
): Promise<{ success: true; sessionId: string } | { success: false; error: string }> {

  try {
    const validatedData = actionSchema.parse(data);

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      const errorMessage = 'CRITICAL: N8N_WEBHOOK_URL is not set in environment variables.';
      console.error(errorMessage);
      return { success: false, error: 'The application is not configured to connect to the itinerary generation service. Please contact support.' };
    }
    
    const sessionId = uuidv4();
    const appUrl = getAppUrl();
    const callbackUrl = `${appUrl}/api/webhook?sessionId=${sessionId}`;

    console.log(`Starting n8n workflow. Session ID: ${sessionId}`);

    // We do not await this response, we just fire and forget
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...validatedData, callbackUrl, sessionId }),
    });

    return { success: true, sessionId };

  } catch (error) {
    console.error('Error in generateItinerary action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, error: errorMessage };
  }
}

export async function pollForResult(sessionId: string): Promise<PollResult> {
  const appUrl = getAppUrl();
  const pollUrl = `${appUrl}/api/webhook?sessionId=${sessionId}`;
  
  const response = await fetch(pollUrl, {
    method: 'GET',
    cache: 'no-store', // Ensure we aren't getting a cached response
  });

  if (!response.ok) {
    throw new Error(`Polling failed with status ${response.status}`);
  }

  return await response.json();
}
