
'use server';

import { v4 as uuidv4 } from 'uuid';
import { format } from "date-fns";
import { z } from 'zod';

import type { Itinerary, TravelPreference } from '@/lib/types';
import { ItinerarySchema, travelPreferenceSchema } from '@/lib/types';
import { notifyListeners } from '@/lib/itinerary-events';

export async function generateItinerary(
  data: TravelPreference,
  appUrl: string
): Promise<{ success: true; sessionId: string } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);
    const sessionId = uuidv4();

    // --- DEVELOPMENT SIMULATION ---
    // This block simulates the n8n workflow for local development 
    // by creating a mock itinerary and notifying the front end directly.
    console.log("SIMULATION: Starting 2-second mock response generation.");

    setTimeout(() => {
      const sampleItinerary: Itinerary = {
        id: `sim-${new Date().getTime()}`,
        destination: validatedData.destination,
        startDate: validatedData.dates.from.toISOString(),
        endDate: validatedData.dates.to.toISOString(),
        days: [
          {
            day: 1,
            date: format(validatedData.dates.from, "MMMM do, yyyy"),
            activities: [
              { time: "9:00 AM", description: "Arrive and check into your simulated hotel.", type: "transport", icon: "plane" },
              { time: "1:00 PM", description: "Lunch at a fantastic simulated local restaurant.", type: "food", icon: "utensils-crossed" },
              { time: "3:00 PM", description: `Explore the area related to your interest in: ${validatedData.interests[0]}.`, type: "activity", icon: "palette" },
            ]
          },
          {
            day: 2,
            date: format(new Date(validatedData.dates.from).setDate(validatedData.dates.from.getDate() + 1), "MMMM do, yyyy"),
            activities: [
              { time: "10:00 AM", description: "A simulated activity based on your preferences.", type: "activity", icon: "sparkles" },
              { time: "7:00 PM", description: "Simulated dinner and evening entertainment.", type: "food", icon: "utensils-crossed" },
            ]
          }
        ]
      };
      
      try {
        const validatedSample = ItinerarySchema.parse(sampleItinerary);
        notifyListeners(sessionId, { itinerary: validatedSample });
        console.log(`SIMULATION: Successfully notified listeners for sessionId: ${sessionId}`);
      } catch (e) {
        if (e instanceof z.ZodError) {
            console.error("SIMULATION ERROR: Zod validation failed for sample itinerary.", e.flatten());
            notifyListeners(sessionId, { error: "The simulated itinerary data format is invalid." });
        }
      }
    }, 2000); // 2-second delay to simulate processing

    return { success: true, sessionId };
    // --- END DEVELOPMENT SIMULATION ---

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
