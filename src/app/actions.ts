
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { ItinerarySchema, travelPreferenceSchema } from '@/lib/types';
import type { Itinerary } from '@/lib/types';

const actionSchema = travelPreferenceSchema.extend({
  dates: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format"),
  })
});

// This type represents the expected successful response from the n8n workflow
const N8NSuccessResponseSchema = z.object({
  itinerary: ItinerarySchema,
});

// This type represents a potential error response from the n8n workflow
const N8NErrorResponseSchema = z.object({
  error: z.boolean(),
  message: z.string(),
});

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
    
    console.log(`Starting n8n workflow directly.`);

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`n8n workflow failed with status ${response.status}:`, errorBody);
        return { success: false, error: `The itinerary service returned an error (Status: ${response.status}).` };
    }

    const responseData = await response.json();
    
    // The incoming body from n8n might be an array due to a Merge node.
    // We need to find the object that contains the itinerary.
    const rawPayload = Array.isArray(responseData) 
        ? responseData.find(item => item.json?.itinerary)?.json 
        : responseData?.json;

    if (!rawPayload) {
        console.error("Invalid response structure from n8n: could not find a payload with an 'itinerary' property.", responseData);
        return { success: false, error: "The itinerary service returned an invalid response structure." };
    }

    // Check if the workflow returned a structured error
    const errorCheck = N8NErrorResponseSchema.safeParse(rawPayload);
    if (errorCheck.success && errorCheck.data.error) {
        console.error('n8n workflow returned a business logic error:', errorCheck.data.message);
        return { success: false, error: errorCheck.data.message };
    }
    
    // Validate the successful response structure
    const result = N8NSuccessResponseSchema.safeParse(rawPayload);

    if (!result.success) {
      console.error("Invalid itinerary structure received from n8n:", result.error.flatten());
      return { success: false, error: "The itinerary service returned an unexpected data format." };
    }

    return { success: true, itinerary: result.data.itinerary };

  } catch (error) {
    console.error('Error in generateItinerary action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating the itinerary.';
    return { success: false, error: errorMessage };
  }
}
