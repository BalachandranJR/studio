
'use server';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import type { TravelPreference } from '@/lib/types';
import { travelPreferenceSchema } from '@/lib/types';

export async function generateItinerary(
  data: TravelPreference,
  appUrl: string
): Promise<{ success: true; sessionId: string } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);
    const sessionId = uuidv4();
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL is not set in environment variables.');
      return { success: false, error: 'The application is not configured to connect to the itinerary generation service. Please contact support.' };
    }

    const callbackUrl = `${appUrl}/api/webhook?sessionId=${sessionId}`;

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validatedData,
        callbackUrl: callbackUrl,
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`n8n webhook call failed with status ${response.status}:`, errorBody);
        return { success: false, error: `There was a problem starting the itinerary generation (status: ${response.status}).` };
    }
    
    // The initial response from n8n confirms the workflow has started.
    // The actual itinerary will be sent later to the callbackUrl.
    return { success: true, sessionId };

  } catch (error) {
    console.error('Error in generateItinerary action:', error);
    if (error instanceof z.ZodError) {
        console.error("Zod validation error on travel preference:", error.flatten());
        return { success: false, error: "The travel preference data format is invalid." };
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, error: errorMessage };
  }
}
