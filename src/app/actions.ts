
'use server';

import { v4 as uuidv4 } from 'uuid';
import { format } from "date-fns";
import { z } from 'zod';

import type { Itinerary, TravelPreference } from '@/lib/types';
import { ItinerarySchema, travelPreferenceSchema } from '@/lib/types';

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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, error: errorMessage };
  }
}

const revisionSchema = z.object({
  itineraryId: z.string(),
  feedback: z.string().min(10, "Please provide more detailed feedback."),
});

export async function reviseItinerary(
  data: { itineraryId: string, feedback: string }
): Promise<{ success: true; itinerary: Itinerary } | { success: false; error: string }> {
  try {
    const { itineraryId, feedback } = revisionSchema.parse(data);
    
    // This is placeholder logic for a future feature.
    await new Promise(resolve => setTimeout(resolve, 2000));

    const revisedItinerary: Itinerary = {
      id: new Date().getTime().toString(),
      destination: "Revised Destination",
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      days: [
        {
          day: 1,
          date: format(new Date(), "MMMM do, yyyy"),
          activities: [
            { time: "10:00 AM", description: `Revision based on feedback: ${feedback}`, type: "activity", icon: "edit" },
            { time: "1:00 PM", description: "A new lunch spot based on your request.", type: "food", icon: "food" },
          ]
        }
      ]
    };
    
    const validatedItinerary = ItinerarySchema.parse(revisedItinerary);

    return { success: true, itinerary: validatedItinerary };

  } catch (error) {
     if (error instanceof z.ZodError) {
      console.error("Zod validation error on revised itinerary:", error.flatten());
      return { success: false, error: "The revised itinerary data format is invalid." };
    }
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during revision." };
  }
}
