
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

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    // Ensure any previous connection is closed before starting a new one.
    cleanup();

    const newEventSource = new EventSource(`/api/itinerary/stream?sessionId=${sessionId}`);
    eventSourceRef.current = newEventSource;
    console.log(`EventSource connected for session: ${sessionId}`);

    const timeoutId = setTimeout(() => {
        console.warn("EventSource timed out.");
        setError("The request timed out while waiting for a response. Please try again.");
        setIsLoading(false);
        cleanup();
    }, 120000); // 2 minute timeout

    newEventSource.onopen = () => {
        console.log("EventSource connection established.");
    };

    newEventSource.onmessage = (event) => {
        // Ignore keep-alive messages
        if (event.data.startsWith(':')) {
            console.log("Received keep-alive ping.");
            return;
        }
        
        console.log("EventSource data received:", event.data);
        
        try {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error("Stream reported an error:", data.error);
                setError(data.error);
                setIsLoading(false);
                clearTimeout(timeoutId);
                cleanup();
            } else if (data.itinerary) {
                console.log("Itinerary received and setting state.");
                setItinerary(data.itinerary);
                setIsLoading(false);
                clearTimeout(timeoutId);
                cleanup();
            }
        } catch (e) {
            console.error("Failed to parse message from EventSource:", e);
            setError("Received invalid data from the server.");
            setIsLoading(false);
            clearTimeout(timeoutId);
            cleanup();
        }
    };

    newEventSource.onerror = (err) => {
        console.error("EventSource encountered an error:", err);
        setError("A connection error occurred. Please check your network and try again.");
        setIsLoading(false);
        clearTimeout(timeoutId);
        cleanup();
    };

    // Main cleanup function when the component unmounts or sessionId changes
    return () => {
        console.log("Cleaning up EventSource due to component unmount or dependency change.");
        clearTimeout(timeoutId);
        cleanup();
    };
  }, [sessionId, cleanup]);

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
    // The useEffect cleanup will handle the event source connection
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
