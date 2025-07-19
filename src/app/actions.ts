
'use server';

import { z } from 'zod';

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

type PollResult = {
    itinerary?: Itinerary;
    error?: string;
} | {
    itinerary: Itinerary
}[];


export async function generateItinerary(
  data: z.infer<typeof actionSchema>
): Promise<{ success: true; itinerary: Itinerary } | { success: false; error: string }> {

  try {
    const validatedData = actionSchema.parse(data);

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      const errorMessage = 'CRITICAL: N8N_WEBHOOK_URL is not set in environment variables.';
      console.error(errorMessage);
      return { success: false, error: 'The application is not configured to connect to the itinerary generation service. Please contact support.' };
    }
    
    console.log("Starting n8n workflow and awaiting response...");

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // We no longer need a callbackUrl as we wait for the response directly
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage = `n8n webhook call failed with status ${response.status}: ${errorBody}`;
        console.error(errorMessage);
        return { success: false, error: `There was a problem communicating with the itinerary generation service (status: ${response.status}).` };
    }
    
    const result: PollResult = await response.json();
    console.log("Successfully received response from n8n workflow.");

    // The CRITICAL FIX IS HERE: Extract the itinerary from the array structure
    const itineraryData = Array.isArray(result) ? result[0]?.itinerary : (result as any)?.itinerary;
    const errorData = (result as { error?: string })?.error;

    if (errorData) {
        console.error(`n8n workflow returned an error:`, errorData);
        return { success: false, error: `The itinerary generation service returned an error: ${errorData}` };
    }

    if (!itineraryData) {
        console.error("No itinerary object found in the n8n response:", JSON.stringify(result, null, 2));
        return { success: false, error: "The response from the itinerary service was incomplete." };
    }

    // Validate the final itinerary object
    const validatedItinerary = ItinerarySchema.parse(itineraryData);
    
    return { success: true, itinerary: validatedItinerary };

  } catch (error) {
    console.error('Error in generateItinerary action:', error);
    if (error instanceof z.ZodError) {
        console.error("Zod validation error details:", error.flatten());
        return { success: false, error: "The itinerary data from the workflow has an invalid format." };
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, error: errorMessage };
  }
}
