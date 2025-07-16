
"use server";

import { z } from "zod";
import { format } from "date-fns";
import type { Itinerary, TravelPreference } from "@/lib/types";
import { ItinerarySchema, travelPreferenceSchema } from "@/lib/types";
import 'dotenv/config'


const revisionSchema = z.object({
  itineraryId: z.string(),
  feedback: z.string().min(10, "Please provide more detailed feedback."),
});

export async function generateItinerary(
  data: TravelPreference
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);
    
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new Error("The N8N_WEBHOOK_URL environment variable is not set.");
    }

    // Fire-and-forget: Send the request but don't wait for the full response.
    // In a real app, n8n would handle sending the result asynchronously (e.g., email).
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validatedData,
        dates: {
          from: validatedData.dates.from.toISOString(),
          to: validatedData.dates.to.toISOString(),
        }
      }),
    }).catch(error => {
      // Log the error but don't block the user.
      console.error("Error sending request to n8n webhook:", error);
    });
    
    // Immediately return success to the UI.
    return { success: true };

  } catch (error) {
    console.error("Error in generateItinerary:", error);
    
    // Handle Zod validation errors on the form data before sending
    if (error instanceof z.ZodError) {
      console.error("Zod validation failed on form input:", error.issues);
      return { 
        success: false, 
        error: "There was an error with your submission. Please check the form and try again." 
      };
    }
    
    // Handle all other errors
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
