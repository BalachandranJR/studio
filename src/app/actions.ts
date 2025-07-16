
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
    
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new Error("The N8N_WEBHOOK_URL environment variable is not set.");
    }

    // A long-running n8n workflow should use a "Respond to Webhook" node.
    // We remove the timeout here to allow the connection to be held open
    // until the workflow is complete.
    const response = await fetch(webhookUrl, {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n webhook error:", errorText);
      throw new Error(`The travel planning service returned an error: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    if (!responseText) {
        return { success: false, error: "The travel service returned an empty response. Please check your n8n workflow's 'Respond to Webhook' node." };
    }

    let responseData;
    try {
        responseData = JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse JSON response:", responseText);
        return { success: false, error: "The travel service returned a response that was not valid JSON." };
    }
    
    // Your existing response parsing logic...
    let rawItineraryData;
    
    if (Array.isArray(responseData)) {
      if (responseData.length === 0) {
        return { success: false, error: "No data received from the travel service." };
      }
      
      const firstItem = responseData[0];
      
      if (firstItem.error) {
        return { success: false, error: firstItem.message || "Travel service returned an error." };
      }
      
      if (firstItem.success && firstItem.itinerary) {
        rawItineraryData = firstItem.itinerary;
      } else if (firstItem.itinerary) {
        rawItineraryData = firstItem.itinerary;
      } else {
        rawItineraryData = firstItem;
      }
    } else if (responseData && typeof responseData === 'object') {
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

    // Ensure required fields
    if (!rawItineraryData.destination) {
      rawItineraryData.destination = validatedData.destination;
    }
    if (!rawItineraryData.startDate) {
      rawItineraryData.startDate = validatedData.dates.from.toISOString();
    }
    if (!rawItineraryData.endDate) {
      rawItineraryData.endDate = validatedData.dates.to.toISOString();
    }

    const itinerary = ItinerarySchema.parse(rawItineraryData);
    
    return { success: true, itinerary };

  } catch (error) {
    console.error("Error in generateItinerary:", error);
    
    // Handle specific timeout errors - This may not be hit if the server itself times out first
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { 
        success: false, 
        error: "The travel planning service is taking longer than expected. Please try again with a shorter trip or simpler preferences." 
      };
    }
    
    // Handle network/fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        success: false, 
        error: "Unable to connect to the travel planning service. Please check your internet connection and try again." 
      };
    }
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error("Zod validation failed:", error.issues);
      return { 
        success: false, 
        error: "The travel service returned invalid data. Please try again or contact support if the issue persists." 
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
