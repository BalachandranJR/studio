
"use server";

import { z } from "zod";
import { format } from "date-fns";
import type { Itinerary, TravelPreference } from "@/lib/types";
import { ItinerarySchema, travelPreferenceSchema } from "@/lib/types";

const revisionSchema = z.object({
  itineraryId: z.string(),
  feedback: z.string().min(10, "Please provide more detailed feedback."),
});


export async function generateItinerary(
  data: TravelPreference
): Promise<{ success: true, itinerary: Itinerary } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);
    
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error("The N8N_WEBHOOK_URL environment variable is not set. Please add it to your .env file.");
    }
    
    // The n8n workflow is now expected to be synchronous.
    // It receives the request, processes it, and returns the final itinerary
    // in the response to this fetch call.
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
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
       const errorBody = await response.text();
       console.error("Error from n8n workflow:", errorBody);
       throw new Error(`The itinerary generation service failed with status: ${response.status}.`);
    }

    const result = await response.json();
    
    // Assuming the n8n workflow's final node returns a JSON object
    // with an "itinerary" key.
    if (!result || !result.itinerary) {
        console.error("Invalid response structure from n8n:", result);
        throw new Error("The itinerary generation service returned an invalid response.");
    }

    const validatedItinerary = ItinerarySchema.parse(result.itinerary);
    
    return { success: true, itinerary: validatedItinerary };

  } catch (error) {
    console.error("Error in generateItinerary:", error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "There was a validation error with the data from the itinerary service." 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." 
    };
  }
}


export async function reviseItinerary(
  data: { itineraryId: string, feedback: string }
): Promise<{ success: true; itinerary: Itinerary } | { success: false; error: string }> {
  try {
    const { feedback } = revisionSchema.parse(data);
    
    // Simulate network delay for revision
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, you would call your AI service here with the original itinerary and the feedback.
    // For now, we'll just return a mock revised itinerary.
    const revisedItinerary: Itinerary = {
      id: new Date().getTime().toString(),
      destination: "Revised Destination",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      days: [
        {
          day: 1,
          date: format(new Date(), "MMMM do, yyyy"),
          activities: [
            { time: "10:00 AM", description: `Revision based on feedback: ${feedback}`, type: "activity", icon: "activity" },
            { time: "1:00 PM", description: "A new lunch spot has been added as requested.", type: "food", icon: "food" },
          ]
        }
      ]
    };

    return { success: true, itinerary: revisedItinerary };
  } catch (error) {
     if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid revision data." };
    }
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}
