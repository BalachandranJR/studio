
"use client";

import { useState, useEffect, useRef } from "react";
import { PlaneTakeoff } from "lucide-react";

import { generateItinerary, checkItineraryStatus } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ItineraryDisplay, ItinerarySkeleton } from "@/components/trip-assist/itinerary-display";
import { TravelPreferenceForm } from "@/components/trip-assist/travel-preference-form";
import type { Itinerary, TravelPreference } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const POLLING_INTERVAL = 3000; // 3 seconds

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use a ref to hold the interval ID to prevent re-renders from affecting it
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startPolling = (currentSessionId: string) => {
    // Stop any existing polling before starting a new one
    stopPolling();
    
    intervalRef.current = setInterval(async () => {
      if (!currentSessionId) {
        stopPolling();
        return;
      }

      const result = await checkItineraryStatus(currentSessionId);

      switch (result.status) {
        case 'completed':
          setItinerary(result.data as Itinerary);
          setIsLoading(false);
          setError(null);
          setSessionId(null);
          stopPolling();
          break;
        case 'error':
          setError(result.error || "An unknown error occurred.");
          setIsLoading(false);
          setSessionId(null);
          stopPolling();
          break;
        case 'processing':
          // Still processing, do nothing
          break;
        case 'not_found':
        default:
          setError("Could not find the itinerary session. It may have expired.");
          setIsLoading(false);
          setSessionId(null);
          stopPolling();
          break;
      }
    }, POLLING_INTERVAL);
  };

  const handleFormSubmit = async (data: TravelPreference) => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    setSessionId(null);

    const result = await generateItinerary(data);

    if (result.success) {
      setSessionId(result.sessionId);
      startPolling(result.sessionId); // Start polling after getting a session ID
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    stopPolling(); // Make sure to stop polling when resetting
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
        {!isLoading && !itinerary && (
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
            <p className="text-center text-lg font-semibold mb-4">Generating your itinerary... This may take a few minutes.</p>
            <ItinerarySkeleton />
          </div>
        )}
        
        {error && !isLoading && (
           <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Error Generating Itinerary</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <button
              onClick={resetForm}
              className="text-primary hover:underline"
            >
              Try again
            </button>
           </div>
        )}

        {itinerary && (
          <div className="mt-8">
            <ItineraryDisplay itinerary={itinerary} setItinerary={setItinerary} />
            <div className="text-center mt-8 no-print">
               <button
                  onClick={resetForm}
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
