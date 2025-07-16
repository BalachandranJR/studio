"use server";

import { z } from "zod";
import { format } from "date-fns";
import type { Itinerary, TravelPreference } from "@/lib/types";
import { generateItineraryFlow } from "@/ai/flows/generate-itinerary-flow";
import { travelPreferenceSchema } from "@/lib/types";


const revisionSchema = z.object({
  itineraryId: z.string(),
  feedback: z.string().min(10, "Please provide more detailed feedback."),
});

export async function generateItinerary(
  data: TravelPreference
): Promise<{ success: true; itinerary: Itinerary } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);
    
    // Simulate a potential error
    if (validatedData.destination.toLowerCase() === "error") {
      throw new Error("Could not generate an itinerary for the selected destination.");
    }
    
    const itinerary = await generateItineraryFlow(validatedData);

    return { success: true, itinerary };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues);
      return { success: false, error: "Invalid form data. Please check your inputs." };
    }
    console.error("Error generating itinerary:", error);
    return { success: false, error: error instanceof Error ? error.message : "An AI error occurred. Please try again." };
  }
}

export async function reviseItinerary(
  data: { itineraryId: string, feedback: string }
): Promise<{ success: true; itinerary: Itinerary } | { success: false; error: string }> {
  try {
    const { feedback } = revisionSchema.parse(data);
    
    // In a real app, you would send the feedback and original itinerary
    // back to your n8n workflow to get a revised version.
    // For this mock, we'll just simulate the process.

    await new Promise(resolve => setTimeout(resolve, 2000));

    // This is where you would receive the revised itinerary.
    // We will return a slightly modified version for demonstration.
    const revisedItinerary: Itinerary = {
      id: new Date().getTime().toString(),
      destination: "Revised Destination",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      days: [
        {
          day: 1,
          date: format(new Date(), "MMMM do, yyyy"),
          activities: [
            { time: "10:00 AM", description: `Revision based on feedback: ${feedback}`, type: "activity", icon: "activity" },
            { time: "1:00 PM", description: "A new lunch spot", type: "food", icon: "food" },
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
