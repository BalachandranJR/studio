
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PlaneTakeoff, Loader2 } from "lucide-react";

import { generateItinerary } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ItineraryDisplay, ItinerarySkeleton } from "@/components/trip-assist/itinerary-display";
import { TravelPreferenceForm } from "@/components/trip-assist/travel-preference-form";
import type { Itinerary, TravelPreference } from "@/lib/types";
import { Button } from "@/components/ui/button";

async function pollForResult(sessionId: string): Promise<{itinerary?: Itinerary, error?: string, status?: string}> {
    const response = await fetch(`/api/webhook?sessionId=${sessionId}`);
    if (!response.ok) {
        throw new Error(`Polling failed with status ${response.status}`);
    }
    const data = await response.json();
    return data;
}

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!sessionId || !isLoading) {
      cleanupPolling();
      return;
    }

    console.log(`Starting polling for sessionId: ${sessionId}`);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log(`Polling for sessionId: ${sessionId}`);
        const result = await pollForResult(sessionId);

        if (result.itinerary) {
          console.log("Itinerary found:", result.itinerary);
          setItinerary(result.itinerary);
          setIsLoading(false);
          cleanupPolling();
        } else if (result.error) {
          console.error("Error received during polling:", result.error);
          setError(result.error);
          setIsLoading(false);
          cleanupPolling();
        } else if (result.status === 'pending') {
            console.log("Still waiting for itinerary...");
        } else {
            console.warn("Unexpected polling response:", result);
        }
      } catch (err) {
        console.error("Polling failed:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during polling.";
        setError(errorMessage);
        setIsLoading(false);
        cleanupPolling();
      }
    }, 3000); // Poll every 3 seconds

    const timeout = setTimeout(() => {
        if (isLoading) {
             console.warn(`Polling timed out for sessionId: ${sessionId}`);
             setError("The request timed out while waiting for a response. The generation service might be busy. Please try again later.");
             setIsLoading(false);
             cleanupPolling();
        }
    }, 180000); // 3-minute timeout

    return () => {
      console.log(`Cleaning up polling for sessionId: ${sessionId}`);
      cleanupPolling();
      clearTimeout(timeout);
    };
  }, [sessionId, isLoading, cleanupPolling]);

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
    cleanupPolling();
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
