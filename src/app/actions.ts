
'use server';

import { v4 as uuidv4 } from 'uuid';
import { format } from "date-fns";
import { z } from 'zod';

import type { Itinerary, TravelPreference } from '@/lib/types';
import { travelPreferenceSchema, ItinerarySchema } from '@/lib/types';

export async function generateItinerary(
  data: TravelPreference
): Promise<{ success: true; sessionId:string } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error(
        'The NEXT_PUBLIC_N8N_WEBHOOK_URL environment variable is not set. Please add it to your .env file.'
      );
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
        throw new Error('The NEXT_PUBLIC_APP_URL environment variable is not set. This is required for the callback.'
        );
    }

    const sessionId = uuidv4();
    const callbackUrl = `${appUrl}/api/webhook?sessionId=${sessionId}`;

    const payload = {
      destination: validatedData.destination,
      dates: {
        from: validatedData.dates.from.toISOString(),
        to: validatedData.dates.to.toISOString(),
      },
      numPeople: validatedData.numPeople,
      ageGroups: validatedData.ageGroups,
      interests: validatedData.interests,
      otherInterests: validatedData.otherInterests,
      budget: validatedData.budget,
      transport: validatedData.transport,
      otherTransport: validatedData.otherTransport,
      foodPreferences: validatedData.foodPreferences,
      otherFoodPreferences: validatedData.otherFoodPreferences,
      callbackUrl: callbackUrl,
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
