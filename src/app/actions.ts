
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

// This now represents the 'data' object within the n8n response
const N8NResponseDataSchema = z.object({
  itinerary: ItinerarySchema,
});

// This represents the top-level structure from the n8n workflow
const N8NSuccessResponseSchema = z.object({
    success: z.literal(true),
    data: N8NResponseDataSchema
});

// This type represents a potential error response from the n8n workflow
const N8NErrorResponseSchema = z.object({
  success: z.literal(false),
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
      cache: 'no-store', // Ensure we always get a fresh response
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`n8n workflow failed with status ${response.status}:`, errorBody);
        return { success: false, error: `The itinerary service returned an error (Status: ${response.status}).` };
    }

    const responseData = await response.json();
    
    // The incoming body from the new n8n workflow should be a single object.
    // Let's add more detailed logging to be sure.
    console.log("Received data from n8n:", JSON.stringify(responseData, null, 2));

    // Check if the workflow returned a structured error first
    if (responseData.success === false) {
        console.error('n8n workflow returned a business logic error:', responseData.message);
        return { success: false, error: responseData.message || "The itinerary service reported an unspecified error." };
    }
    
    // Validate the successful response structure
    const result = N8NSuccessResponseSchema.safeParse(responseData);

    if (!result.success) {
      console.error("Invalid itinerary structure received from n8n:", result.error.flatten());
      return { success: false, error: "The itinerary service returned an unexpected data format." };
    }

    return { success: true, itinerary: result.data.data.itinerary };

  } catch (error) {
    console.error('Error in generateItinerary action:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: 'There was a validation error with the form data.' };
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating the itinerary.';
    return { success: false, error: errorMessage };
  }
}
