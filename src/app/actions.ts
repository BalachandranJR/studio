
'use server';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import type { TravelPreference } from '@/lib/types';
import { travelPreferenceSchema } from '@/lib/types';

function getAppUrl() {
  // 1. Vercel specific environment variables for the deployed URL.
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  // 2. A fallback for other environments, expecting NEXT_PUBLIC_APP_URL to be set.
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // 3. Fallback for local development.
  return 'http://localhost:9002';
}

export async function generateItinerary(
  data: TravelPreference
): Promise<{ success: true; sessionId: string } | { success: false; error: string }> {
  console.log('generateItinerary action started.');

  try {
    const validatedData = travelPreferenceSchema.parse(data);
    console.log('Travel preference data validated successfully.');

    const sessionId = uuidv4();
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error('CRITICAL: N8N_WEBHOOK_URL is not set in environment variables.');
      return { success: false, error: 'The application is not configured to connect to the itinerary generation service. Please contact support.' };
    }

    const appUrl = getAppUrl();
    const callbackUrl = `${appUrl}/api/webhook?sessionId=${sessionId}`;
    
    console.log("Using n8n Webhook URL:", n8nWebhookUrl);
    console.log("Constructed App URL:", appUrl);
    console.log("Using Callback URL:", callbackUrl);

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
        return { success: false, error: `There was a problem starting the itinerary generation (status: ${response.status}). The remote service might be unavailable.` };
    }
    
    console.log("Successfully started n8n workflow. Session ID:", sessionId);
    return { success: true, sessionId };

  } catch (error) {
    console.error('Error in generateItinerary action:', error);
    if (error instanceof z.ZodError) {
        console.error("Zod validation error details:", error.flatten());
        return { success: false, error: "The travel preference data format is invalid." };
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, error: errorMessage };
  }
}
