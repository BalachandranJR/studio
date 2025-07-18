
"use client";

import { useEffect, useState, useCallback } from "react";
import { PlaneTakeoff, Loader2 } from "lucide-react";

import { generateItinerary } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ItineraryDisplay, ItinerarySkeleton } from "@/components/trip-assist/itinerary-display";
import { TravelPreferenceForm } from "@/components/trip-assist/travel-preference-form";
import type { Itinerary, TravelPreference } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(`/api/itinerary/stream?sessionId=${sessionId}`);

    eventSource.onmessage = (event) => {
      // The event data is a JSON string, so we parse it.
      const eventData = JSON.parse(event.data);

      if (eventData.error) {
        console.error("Error received from server stream:", eventData.error);
        setError(eventData.error);
        setIsLoading(false);
        eventSource.close();
      } else if (eventData.itinerary) {
        console.log("Itinerary received, updating state:", eventData.itinerary);
        setItinerary(eventData.itinerary);
        setIsLoading(false);
        eventSource.close();
      }
    };
    
    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setError("Connection to the server was lost while waiting for the itinerary. Please try again.");
      setIsLoading(false);
      eventSource.close();
    };

    // Cleanup function to close the connection when the component unmounts or sessionId changes
    return () => {
      eventSource.close();
    };
  }, [sessionId]);


  const handleFormSubmit = async (data: TravelPreference) => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    setSessionId(null);
    
    const result = await generateItinerary(data);

    if (result.success) {
      setSessionId(result.sessionId);
    } else {
      console.error("Error from generateItinerary action:", result.error);
      setError(result.error);
      setIsLoading(false);
    }
  };
  
  const resetApp = () => {
    setItinerary(null);
    setIsLoading(false);
    setError(null);
    setSessionId(null);
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
        {!isLoading && !itinerary && !error && (
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

        {isLoading && (
          <div>
            <p className="text-center text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating your itinerary... This may take a moment.
            </p>
            <ItinerarySkeleton />
          </div>
        )}
        
        {error && !isLoading && (
           <div className="space-y-4 text-center">
            <Alert variant="destructive">
              <AlertTitle>Error Generating Itinerary</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={resetApp}
              variant="outline"
            >
              Start New Plan
            </Button>
           </div>
        )}

        {itinerary && !isLoading && (
          <div className="mt-8">
            <ItineraryDisplay itinerary={itinerary} onRestart={resetApp} />
          </div>
        )}
      </div>
       <footer className="text-center mt-16 text-sm text-muted-foreground">
        <p>Powered by AI. Double-check all reservations and opening times before you travel.</p>
      </footer>
    </main>
  );
}
