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

// Enhanced schema to include the new displayText field
const N8NSuccessResponseSchema = z.object({
    success: z.literal(true),
    message: z.string().optional(),
    data: ItinerarySchema.extend({
        formattedDisplay: z.string().optional(), // The formatted text from the workflow
    }),
    displayText: z.string().optional(), // Alternative location for formatted text
});

// This type represents a potential error response from the n8n workflow
const N8NErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.string().optional(),
  details: z.string().optional(),
});

// Extended return type to include formatted display text
export type ItineraryResult = 
  | { success: true; itinerary: Itinerary & { formattedDisplay?: string }; displayText?: string }
  | { success: false; error: string };

export async function generateItinerary(
  data: z.infer<typeof actionSchema>
): Promise<ItineraryResult> {

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
      cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`n8n workflow failed with status ${response.status}:`, errorBody);
        return { success: false, error: `The itinerary service returned an error (Status: ${response.status}).` };
    }

    const rawResponse = await response.json();
    
    // The incoming body from n8n is often an array with one element
    const responseData = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;
    
    console.log("Received data from n8n:", JSON.stringify(responseData, null, 2));

    // Check if the workflow returned a structured error first
    if (responseData.success === false) {
        console.error('n8n workflow returned a business logic error:', responseData.message || responseData.error);
        return { 
            success: false, 
            error: responseData.message || responseData.error || "The itinerary service reported an unspecified error." 
        };
    }
    
    // Validate the successful response structure
    const result = N8NSuccessResponseSchema.safeParse(responseData);

    if (!result.success) {
      console.error("Invalid itinerary structure received from n8n:", result.error.flatten());
      console.error("Raw response data:", JSON.stringify(responseData, null, 2));
      return { success: false, error: "The itinerary service returned an unexpected data format." };
    }

    // Extract both the itinerary data and the formatted display text
    const itineraryData = result.data.data;
    const displayText = result.data.displayText || itineraryData.formattedDisplay;

    // Return the itinerary with optional formatted display text
    return { 
        success: true, 
        itinerary: itineraryData,
        displayText: displayText
    };

  } catch (error) {
    console.error('Error in generateItinerary action:', error);
    if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', error.flatten());
        return { success: false, error: 'There was a validation error with the form data.' };
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating the itinerary.';
    return { success: false, error: errorMessage };
  }
}
