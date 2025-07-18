
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

export const transportOptions = [
    { id: "flight", label: "Flight" },
    { id: "train", label: "Train" },
    { id: "car_rental", label: "Car Rental" },
    { id: "bus", label: "Bus" },
    { id: "boat_ferry", label: "Boat / Ferry" },
    { id: "bike", label: "Bike" },
    { id: "walking", label: "Walking" },
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
  transport: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one transport preference.",
  }),
  otherTransport: z.string().optional(),
  foodPreferences: z.array(z.string()).optional(),
  otherFoodPreferences: z.string().optional(),
});

export type TravelPreference = z.infer<typeof travelPreferenceSchema>;

// Updated ActivitySchema to match n8n workflow output
export const ActivitySchema = z.object({
  time: z.string().describe("The time of the activity, e.g., '9:00 AM' or 'Morning'."),
  description: z.string().describe("A brief description of the activity."),
  name: z.string().optional().describe("The name of the activity."), // Keeping this as it might be what gets displayed
  type: z.string().describe("The category of the activity.").catch("activity"), // Provide a default
  icon: z.string().describe("An icon name representing the activity type.").catch("default"), // Provide a default
  location: z.string().optional(),
  cost: z.string().optional(),
  transport: z.string().optional(),
});

export const ItineraryDaySchema = z.object({
  day: z.number().describe("The day number of the itinerary, starting from 1."),
  date: z.string().describe("The date for this day's activities."),
  activities: z.array(ActivitySchema).describe("A list of activities for the day."),
});

// Updated ItinerarySchema to match n8n workflow output
export const ItinerarySchema = z.object({
  destination: z.string().describe("The travel destination."),
  startDate: z.string().describe("The start date of the trip, can be a full ISO string."),
  endDate: z.string().describe("The end date of the trip, can be a full ISO string."),
  days: z.array(ItineraryDaySchema).describe("A list of days, each with their own schedule."),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;
export type Itinerary = z.infer<typeof ItinerarySchema>;
