import { z } from "zod";

export const ageGroups = [
  { id: "infants", label: "Infants (0-1)" },
  { id: "children", label: "Children (2-12)" },
  { id: "teenagers", label: "Teenagers (13-19)" },
  { id: "young_adults", label: "Young Adults (20-35)" },
  { id: "adults", label: "Adults (36-64)" },
  { id: "seniors", label: "Seniors (65+)" },
] as const;

export const areasOfInterest = [
    { id: "beaches_water_sports", label: "Beaches & Water Sports" },
    { id: "museums_galleries", label: "Museums & Galleries" },
    { id: "adventure_sports", label: "Adventure Sports" },
    { id: "local_cuisine", label: "Local Cuisine" },
    { id: "historical_sites", label: "Historical Sites" },
    { id: "nature_wildlife", label: "Nature & Wildlife" },
    { id: "shopping", label: "Shopping" },
    { id: "nightlife", label: "Nightlife" },
    { id: "architecture", label: "Architecture" },
    { id: "photography", label: "Photography" },
    { id: "festivals_events", label: "Festivals & Events" },
    { id: "wellness_spa", label: "Wellness & Spa" },
] as const;

export const foodPreferences = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "gluten_free", label: "Gluten-Free" },
    { id: "halal", label: "Halal" },
    { id: "kosher", label: "Kosher" },
    { id: "dairy_free", label: "Dairy-Free" },
] as const;

export const travelPreferenceSchema = z.object({
  destination: z.string().min(3, "Destination must be at least 3 characters long."),
  dates: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
  numPeople: z.coerce.number().int().min(1, "At least one person must be travelling."),
  ageGroups: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one age group.",
  }),
  interests: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one area of interest.",
  }),
  otherInterests: z.string().optional(),
  budget: z.object({
    currency: z.string().min(1, "Please select a currency."),
    amount: z.coerce.number({invalid_type_error: "Please enter a valid number."}).min(1, "Budget must be at least 1."),
  }),
  transport: z.enum(["flights", "train", "car"]),
  foodPreferences: z.array(z.string()).optional(),
  otherFoodPreferences: z.string().optional(),
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
