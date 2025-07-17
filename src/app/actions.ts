
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

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error(
        'The N8N_WEBHOOK_URL environment variable is not set. Please add it to your .env file.'
      );
    }
    
    if (!appUrl) {
        throw new Error('The application URL was not provided by the client. Cannot create callback.');
    }

    // Function to fix protocol-relative URLs and ensure a protocol exists.
    function normalizeUrl(url: string): string {
      // Handle protocol-relative URLs
      if (url.startsWith('//')) {
        return `https:${url}`;
      }
      // Handle URLs without a protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    }

    const normalizedAppUrl = normalizeUrl(appUrl);

    // Final check to prevent localhost URLs
    if (normalizedAppUrl.includes('localhost') || normalizedAppUrl.includes('127.0.0.1')) {
        const errorMessage = "The application URL is a localhost address. n8n requires a public URL to send the itinerary back.";
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }

    const sessionId = uuidv4();
    const callbackUrl = `${normalizedAppUrl}/api/webhook?sessionId=${sessionId}`;
    
    console.log('Raw App URL from client:', appUrl);
    console.log('Normalized App URL:', normalizedAppUrl);
    console.log('Generated Callback URL for n8n:', callbackUrl);

    // Validate the final URL format
    try {
      new URL(callbackUrl);
    } catch (e) {
      const errorMessage = `Invalid callback URL format after normalization: ${callbackUrl}`;
      console.error(errorMessage, e);
      return { success: false, error: errorMessage };
    }


    const payload = {
        ...validatedData,
        dates: {
            from: validatedData.dates.from.toISOString(),
            to: validatedData.dates.to.toISOString(),
        },
        callbackUrl: callbackUrl,
    };

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error from n8n workflow:', errorBody);
        throw new Error(
            `The itinerary generation service failed with status: ${response.status} ${response.statusText}.`
        );
    }

    console.log('Successfully sent request to n8n.');

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
