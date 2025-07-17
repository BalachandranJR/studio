'use server';

import type { z } from 'zod';
import type { Itinerary, TravelPreference } from '@/lib/types';
import { travelPreferenceSchema } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function generateItinerary(
  data: TravelPreference
): Promise<{ success: true; sessionId: string } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error(
        'The N8N_WEBHOOK_URL environment variable is not set. Please add it to your .env file.'
      );
    }
    
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
        throw new Error('The APP_URL environment variable is not set. This is required for the callback.'
        );
    }

    const sessionId = uuidv4();
    const callbackUrl = `${appUrl}/api/webhook?sessionId=${sessionId}`;

    const payload = {
      ...validatedData,
      dates: {
        from: validatedData.dates.from.toISOString(),
        to: validatedData.dates.to.toISOString(),
      },
      callbackUrl: callbackUrl, // Pass the callback URL to n8n
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error from n8n workflow:', errorBody);
      throw new Error(
        `The itinerary generation service failed with status: ${response.status}.`
      );
    }

    // The initial response from n8n is just an acknowledgment.
    // The actual itinerary will be sent to the callbackUrl.
    await response.json();

    return { success: true, sessionId };
    
  } catch (error) {
    console.error('Error in generateItinerary:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
