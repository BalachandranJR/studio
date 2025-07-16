import { z } from "zod";

export const travelPreferenceSchema = z.object({
  destination: z.string().min(3, "Destination must be at least 3 characters long."),
  dates: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
  numPeople: z.coerce.number().int().min(1, "At least one person must be travelling."),
  interests: z.string().min(5, "Please describe your interests.").max(500, "Please keep interests under 500 characters."),
  budget: z.enum(["economy", "mid-range", "luxury"]),
  transport: z.enum(["flights", "train", "car"]),
});

export type TravelPreference = z.infer<typeof travelPreferenceSchema>;

export interface Activity {
  time: string;
  description: string;
  type: 'food' | 'activity' | 'transport' | 'accommodation' | 'attraction';
  icon: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
}

export interface Itinerary {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: ItineraryDay[];
}
