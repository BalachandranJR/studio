"use client";

import { useState } from "react";
import { PlaneTakeoff } from "lucide-react";

import { generateItinerary } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ItineraryDisplay, ItinerarySkeleton } from "@/components/trip-assist/itinerary-display";
import { TravelPreferenceForm } from "@/components/trip-assist/travel-preference-form";
import type { Itinerary, TravelPreference } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = async (data: TravelPreference) => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);

    const result = await generateItinerary(data);

    if (result.success) {
      setItinerary(result.itinerary);
      setError(null); // Explicitly clear any previous errors on success
      toast({
        title: "Itinerary Generated!",
        description: "Your personalized trip plan is ready to view.",
      });
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center bg-primary/10 text-primary p-3 rounded-full mb-4">
          <PlaneTakeoff className="h-8 w-8" />
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold">
          TripAssist
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Your personal AI travel planner. Just tell us your preferences, and we'll handle the rest.
        </p>
      </header>

      <div className="max-w-4xl mx-auto">
        {!itinerary && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Plan Your Next Adventure</CardTitle>
              <CardDescription>Fill out the form below to generate a custom itinerary.</CardDescription>
            </CardHeader>
            <CardContent>
              <TravelPreferenceForm onSubmit={handleFormSubmit} isPending={isLoading} />
            </CardContent>
          </Card>
        )}

        {isLoading && <ItinerarySkeleton />}
        
        {error && (
           <Alert variant="destructive" className="mt-8">
            <AlertTitle>Error Generating Itinerary</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {itinerary && (
          <div className="mt-8">
            <ItineraryDisplay itinerary={itinerary} setItinerary={setItinerary} />
            <div className="text-center mt-8 no-print">
               <button
                  onClick={() => {
                    setItinerary(null);
                    setError(null);
                  }}
                  className="text-primary hover:underline"
                >
                  Start a new plan
                </button>
            </div>
          </div>
        )}
      </div>
       <footer className="text-center mt-16 text-sm text-muted-foreground">
        <p>Powered by AI. Double-check all reservations and opening times before you travel.</p>
      </footer>
    </main>
  );
}
