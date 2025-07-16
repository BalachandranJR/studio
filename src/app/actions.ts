
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
): Promise<{ success: true; itinerary: Itinerary } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);
    
    // The n8n webhook endpoint
    const webhookUrl = "https://n8n-ishj.onrender.com/webhook-test/travel-planner";

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Dates need to be converted to strings for JSON serialization
      body: JSON.stringify({
        ...validatedData,
        dates: {
          from: validatedData.dates.from.toISOString(),
          to: validatedData.dates.to.toISOString(),
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n webhook error:", errorText);
      throw new Error(`The travel planning service returned an error: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    let itineraryData = responseData.data || responseData;

    // Ensure the start and end dates from the form are on the final itinerary object
    itineraryData.startDate = validatedData.dates.from.toISOString();
    itineraryData.endDate = validatedData.dates.to.toISOString();

    const itinerary = ItinerarySchema.parse(itineraryData);
    
    return { success: true, itinerary };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues);
      return { success: false, error: "Invalid data received from the travel service. Please check the n8n workflow output." };
    }
    console.error("Error generating itinerary:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred. Please try again." };
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
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
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
