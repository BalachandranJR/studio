
'use server';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import type { TravelPreference } from '@/lib/types';
import { travelPreferenceSchema } from '@/lib/types';

function getAppUrl() {
  // 1. Vercel deployment URL (prefer NEXT_PUBLIC_APP_URL if set).
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 2. Fallback for local development.
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
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nWebhookUrl) {
      const errorMessage = 'CRITICAL: N8N_WEBHOOK_URL is not set in environment variables.';
      console.error(errorMessage);
      return { success: false, error: 'The application is not configured to connect to the itinerary generation service. Please contact support.' };
    }

    if (!n8nApiKey) {
        const errorMessage = 'CRITICAL: N8N_API_KEY is not set in environment variables. Authentication is required.';
        console.error(errorMessage);
        return { success: false, error: 'The application is not configured for authentication with the itinerary service. Please contact support.' };
    }


    const appUrl = getAppUrl();
    const callbackUrl = `${appUrl}/api/webhook?sessionId=${sessionId}`;
    
    console.log("Using n8n Webhook URL:", n8nWebhookUrl);
    console.log("Constructed App URL:", appUrl);
    console.log("Using Callback URL:", callbackUrl);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${n8nApiKey}`,
    };

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        ...validatedData,
        callbackUrl: callbackUrl,
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `n8n webhook call failed with status ${response.status}: ${errorBody}`;
        console.error(errorMessage);
        // Provide a clearer message to the user
        if (response.status === 401) {
             return { success: false, error: `Authentication with the itinerary service failed. Please check the API key.` };
        }
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
