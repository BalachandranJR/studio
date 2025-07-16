
"use client";

import { useState, useEffect } from "react";
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isSubmitted && !itinerary && !error) {
      // Generate a unique session ID for this request
      const newSessionId = Date.now().toString();
      setSessionId(newSessionId);

      // Start listening for the itinerary from the server
      const eventSource = new EventSource(`/api/itinerary/stream?sessionId=${newSessionId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          eventSource.close();
        } else {
          setItinerary(data as Itinerary);
          setIsLoading(false);
          setError(null);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setError("Connection to the server was lost. Please try again.");
        setIsLoading(false);
        eventSource.close();
      };

      // Clean up the connection when the component unmounts or the state changes
      return () => {
        eventSource.close();
      };
    }
  }, [isSubmitted, itinerary, error]);

  const handleFormSubmit = async (data: TravelPreference) => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);
    setIsSubmitted(false); // Reset submission state
    setSessionId(null); // Reset session ID

    const result = await generateItinerary(data);

    if (result.success) {
      setIsSubmitted(true);
      setError(null);
    } else {
      setError(result.error);
      setIsLoading(false);
    }
    // We keep isLoading true here, because we are now waiting for the SSE response
  };
  
  const resetForm = () => {
    setIsSubmitted(false);
    setError(null);
    setItinerary(null);
    setIsLoading(false);
    setSessionId(null);
  }

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
              <TravelPreferenceForm onSubmit={handleFormSubmit} isPending={isLoading && !isSubmitted} />
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
