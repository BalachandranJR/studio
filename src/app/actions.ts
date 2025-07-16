
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
): Promise<{ success: true; itinerary: Itinerary } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);
    
    // The n8n webhook endpoint
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new Error("The N8N_WEBHOOK_URL environment variable is not set.");
    }

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
      // Add a 2-minute timeout to allow the n8n workflow to complete
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n webhook error:", errorText);
      throw new Error(`The travel planning service returned an error: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log("Raw webhook response:", JSON.stringify(responseData, null, 2));
    
    // Based on your webhook response structure, handle the array format
    let rawItineraryData;
    
    if (Array.isArray(responseData)) {
      // Response is an array
      if (responseData.length === 0) {
        return { success: false, error: "No data received from the travel service." };
      }
      
      const firstItem = responseData[0];
      
      // Check if it's an error response
      if (firstItem.error) {
        return { success: false, error: firstItem.message || "Travel service returned an error." };
      }
      
      // Check if it has success flag and itinerary
      if (firstItem.success && firstItem.itinerary) {
        rawItineraryData = firstItem.itinerary;
      } else if (firstItem.itinerary) {
        rawItineraryData = firstItem.itinerary;
      } else {
        // Fallback - use the first item directly
        rawItineraryData = firstItem;
      }
    } else if (responseData && typeof responseData === 'object') {
      // Response is a single object
      if (responseData.error) {
        return { success: false, error: responseData.message || "Travel service returned an error." };
      }
      
      if (responseData.success && responseData.itinerary) {
        rawItineraryData = responseData.itinerary;
      } else if (responseData.itinerary) {
        rawItineraryData = responseData.itinerary;
      } else {
        rawItineraryData = responseData;
      }
    } else {
      return { success: false, error: "Invalid response format from travel service." };
    }

    if (!rawItineraryData) {
      return { success: false, error: "No itinerary data found in the response." };
    }

    console.log("Extracted itinerary data:", JSON.stringify(rawItineraryData, null, 2));

    // Ensure the start date, end date, and destination from the form are on the final itinerary object
    // This is crucial because the webhook might not return them in the expected format.
    if (!rawItineraryData.destination) {
      rawItineraryData.destination = validatedData.destination;
    }
    if (!rawItineraryData.startDate) {
      rawItineraryData.startDate = validatedData.dates.from.toISOString();
    }
    if (!rawItineraryData.endDate) {
      rawItineraryData.endDate = validatedData.dates.to.toISOString();
    }

    // Validate the itinerary structure
    const itinerary = ItinerarySchema.parse(rawItineraryData);
    
    console.log("Validated itinerary:", JSON.stringify(itinerary, null, 2));
    
    return { success: true, itinerary };

  } catch (error) {
    console.error("Error in generateItinerary:", error);
    
    if (error instanceof z.ZodError) {
      console.error("Zod validation failed:", error.issues);
      return { 
        success: false, 
        error: `Invalid data structure from travel service: ${error.issues.map(i => i.message).join(', ')}` 
      };
    }
    
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return {
        success: false,
        error: "The request to the travel planning service timed out. Please try again."
      }
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unknown error occurred. Please try again." 
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
