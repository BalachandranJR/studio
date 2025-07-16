"use server";

import { z } from "zod";
import { addDays, format } from "date-fns";
import type { Itinerary, TravelPreference } from "@/lib/types";
import { travelPreferenceSchema } from "@/lib/types";

const revisionSchema = z.object({
  itineraryId: z.string(),
  feedback: z.string().min(10, "Please provide more detailed feedback."),
});

// This is a mocked function. In a real application, you would make a POST request
// to your n8n workflow endpoint with the travel preference data.
// const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
// const response = await fetch(N8N_WEBHOOK_URL, {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify(data),
// });
// const itinerary = await response.json();

const generateMockItinerary = (data: TravelPreference): Itinerary => {
  const { destination, dates, numPeople } = data;
  const id = new Date().getTime().toString();
  const startDate = format(dates.from, "yyyy-MM-dd");
  const endDate = format(dates.to, "yyyy-MM-dd");

  const itineraryDays = [];
  let currentDate = dates.from;
  let dayCount = 1;
  while (currentDate <= dates.to) {
    itineraryDays.push({
      day: dayCount,
      date: format(currentDate, "MMMM do, yyyy"),
      activities: [
        { time: "9:00 AM", description: `Breakfast at a local cafe`, type: "food", icon: "food" },
        { time: "10:30 AM", description: `Explore the central square of ${destination}`, type: "attraction", icon: "attraction" },
        { time: "1:00 PM", description: "Lunch featuring regional specialties", type: "food", icon: "food" },
        { time: "3:00 PM", description: "Visit a museum or art gallery", type: "activity", icon: "activity" },
        { time: "7:00 PM", description: `Dinner for ${numPeople} at a highly-rated restaurant`, type: "food", icon: "food" },
        { time: "All Day", description: "Check into your accommodation", type: "accommodation", icon: "accommodation" },
      ],
    });
    currentDate = addDays(currentDate, 1);
    dayCount++;
  }

  return {
    id,
    destination,
    startDate,
    endDate,
    days: itineraryDays,
  };
};

export async function generateItinerary(
  data: TravelPreference
): Promise<{ success: true; itinerary: Itinerary } | { success: false; error: string }> {
  try {
    const validatedData = travelPreferenceSchema.parse(data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const itinerary = generateMockItinerary(validatedData);

    // Simulate a potential error
    if (validatedData.destination.toLowerCase() === "error") {
      throw new Error("Could not generate an itinerary for the selected destination.");
    }
    
    return { success: true, itinerary };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues);
      return { success: false, error: "Invalid form data. Please check your inputs." };
    }
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
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
      endDate: format(addDays(new Date(), 4), "yyyy-MM-dd"),
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
