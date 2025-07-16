'use server';
/**
 * @fileOverview A flow for generating a travel itinerary.
 *
 * - generateItineraryFlow - The main flow function.
 * - ItineraryInput - The Zod schema for the input.
 * - Itinerary - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ItinerarySchema, travelPreferenceSchema } from '@/lib/types';
import { format } from 'date-fns';
import type { Itinerary } from '@/lib/types';

export type ItineraryInput = z.infer<typeof travelPreferenceSchema>;

export async function generateItineraryFlow(input: ItineraryInput): Promise<Itinerary> {
  return itineraryGeneratorFlow(input);
}

const itineraryGeneratorFlow = ai.defineFlow(
  {
    name: 'itineraryGeneratorFlow',
    inputSchema: travelPreferenceSchema,
    outputSchema: ItinerarySchema,
  },
  async (preferences) => {
    const prompt = `
      You are a world-class travel agent, tasked with creating a personalized travel itinerary.
      The user has provided the following preferences:

      - Destination: ${preferences.destination}
      - Dates: ${format(preferences.dates.from, 'MMMM do, yyyy')} to ${format(preferences.dates.to, 'MMMM do, yyyy')}
      - Number of People: ${preferences.numPeople}
      - Traveler Age Groups: ${preferences.ageGroups.join(', ')}
      - Areas of Interest: ${preferences.interests.join(', ')}
      ${preferences.otherInterests ? `- Other Interests: ${preferences.otherInterests}` : ''}
      - Budget: ${preferences.budget.amount} ${preferences.budget.currency} per person
      - Transport Preferences: ${preferences.transport.join(', ')}
      ${preferences.otherTransport ? `- Other Transport: ${preferences.otherTransport}` : ''}
      - Food Preferences: ${preferences.foodPreferences?.join(', ') || 'None'}
      ${preferences.otherFoodPreferences ? `- Other Food Preferences: ${preferences.otherFoodPreferences}` : ''}

      Please generate a detailed day-by-day itinerary. For each activity, provide a time, a description, and a type.
      The output must be in the specified JSON format. The itinerary ID should be a unique string, you can use the current timestamp. The start and end dates should be in 'yyyy-MM-dd' format.
      Be creative and tailor the suggestions to the user's interests. For example, if they like "Nature & Wildlife", suggest parks, hikes, or wildlife tours.
      If they like "Historical Sites", include museums, ancient ruins, or famous landmarks.
      Ensure the activities are appropriate for the specified age groups.
      Vary the activity types throughout the day (e.g., mix sightseeing with meals and relaxation).
      Assign an appropriate icon for each activity from this list: ['food', 'activity', 'transport', 'accommodation', 'attraction'].
    `;
    
    const { output } = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.0-flash',
      output: {
        schema: ItinerarySchema,
      },
      config: {
        temperature: 0.7
      }
    });

    return output!;
  }
);
