
"use server";

import { z } from "zod";
import { format } from "date-fns";
import type { Itinerary, TravelPreference } from "@/lib/types";
import { ItinerarySchema, travelPreferenceSchema } from "@/lib/types";
import 'dotenv/config'

// In-memory storage for itinerary results (replace with database in production)
const itineraryResults = new Map<string, {
  status: 'processing' | 'completed' | 'error';
  data?: Itinerary;
  error?: string;
  timestamp: number;
}>();

// Cleanup old results every 10 minutes
setInterval(() => {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  
  for (const [key, value] of itineraryResults.entries()) {
    if (now - value.timestamp > TEN_MINUTES) {
      itineraryResults.delete(key);
    }
  }
}, 10 * 60 * 1000);

const revisionSchema = z.object({
  itineraryId: z.string(),
  feedback: z.string().min(10, "Please provide more detailed feedback."),
});


// This function is now responsible for POSTing the result back from n8n
export async function completeItinerary(
  sessionId: string,
  result: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!sessionId) {
      return { success: false, error: 'Session ID is required.' };
    }

    if (result.success && result.itinerary) {
      const validatedItinerary = ItinerarySchema.parse(result.itinerary);
      itineraryResults.set(sessionId, {
        status: 'completed',
        data: validatedItinerary,
        timestamp: Date.now()
      });
    } else {
      itineraryResults.set(sessionId, {
        status: 'error',
        error: result.error || "The workflow failed to generate an itinerary.",
        timestamp: Date.now()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error handling webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process itinerary response";
     itineraryResults.set(sessionId, {
        status: 'error',
        error: errorMessage,
        timestamp: Date.now()
      });
    return { success: false, error: errorMessage };
  }
}


// This function starts the process and is called by the form
export async function generateItinerary(
  data: TravelPreference
): Promise<{ success: true, sessionId: string } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);
    
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error("The N8N_WEBHOOK_URL environment variable is not set.");
    }
    
    const sessionId = Date.now().toString();
    
    // Store initial processing state
    itineraryResults.set(sessionId, {
      status: 'processing',
      timestamp: Date.now()
    });

    // In your n8n workflow, you will need a final "Respond to Webhook" node
    // that POSTs back to your application's `/api/webhook` endpoint.
    // That endpoint will call the `completeItinerary` function above.
    const hardcodedAppUrl = "https://6000-firebase-studio-1752627865956.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev/";
    const callbackUrl = `${hardcodedAppUrl}api/webhook`;

    const payload = {
      sessionId,
      callbackUrl, // URL for n8n to POST the result back to
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

    // Fire-and-forget request to n8n. We don't wait for the response here.
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((error) => {
      // If the initial fetch fails, log it and set the status to error.
      // The frontend polling will pick up this error.
      console.error("Error sending initial request to n8n:", error);
      itineraryResults.set(sessionId, {
        status: 'error',
        error: "Could not connect to the itinerary generation service.",
        timestamp: Date.now()
      });
    });
    
    // Immediately return the sessionId to the client so it can start polling.
    return { success: true, sessionId };

  } catch (error) {
    console.error("Error in generateItinerary:", error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "There was an error with your submission. Please check the form and try again." 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." 
    };
  }
}

// New function for the client to poll
export async function checkItineraryStatus(sessionId: string): Promise<{
  status: 'processing' | 'completed' | 'error' | 'not_found';
  data?: Itinerary;
  error?: string;
}> {
  const result = itineraryResults.get(sessionId);
  
  if (!result) {
    // To handle race conditions where polling starts before the item is set
    await new Promise(resolve => setTimeout(resolve, 500));
    const delayedResult = itineraryResults.get(sessionId);
     if (!delayedResult) {
       return { status: 'not_found' };
     }
     return {
      status: delayedResult.status,
      data: delayedResult.data,
      error: delayedResult.error
    };
  }
  
  return {
    status: result.status,
    data: result.data,
    error: result.error
  };
}

export async function reviseItinerary(
  data: { itineraryId: string, feedback: string }
): Promise<{ success: true; itinerary: Itinerary } | { success: false; error: string }> {
  try {
    const { feedback } = revisionSchema.parse(data);
    
    await new Promise(resolve => setTimeout(resolve, 2000));

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
