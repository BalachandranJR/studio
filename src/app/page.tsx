
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PlaneTakeoff, Loader2, Send } from "lucide-react";

import { generateItinerary } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ItineraryDisplay } from "@/components/trip-assist/itinerary-display";
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

const LoadingAnimation = () => (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
        <div className="relative w-full h-16 overflow-hidden">
            <div className="absolute top-1/2 -translate-y-1/2 animate-fly">
                <Send className="w-12 h-12 text-primary -rotate-45" />
            </div>
        </div>
        <h3 className="text-xl font-semibold">Generating your custom itinerary...</h3>
        <p className="text-muted-foreground">Our AI is planning your perfect trip. This may take a minute or two.</p>
    </div>
);


export default function Home() {
  const [appState, setAppState] = useState<'initial' | 'form' | 'loading' | 'result' | 'error'>('initial');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((sid: string) => {
    cleanupPolling();
    
    let attempts = 0;
    const maxAttempts = 100; // Poll for 5 minutes

    const poll = async () => {
        if (attempts >= maxAttempts) {
            cleanupPolling();
            setError("The request timed out. The generation service might be busy or failed to respond. Please try again later.");
            setAppState('error');
            return;
        }
        
        attempts++;

        try {
            const result = await pollForResult(sid);

            if (result.itinerary) {
                cleanupPolling();
                setItinerary(result.itinerary);
                setAppState('result');
            } else if (result.error) {
                cleanupPolling();
                setError(result.error);
                setAppState('error');
            } else {
                pollingIntervalRef.current = setTimeout(poll, 3000);
            }
        } catch (err) {
            cleanupPolling();
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during polling.";
            setError(errorMessage);
            setAppState('error');
        }
    };
    
    pollingIntervalRef.current = setTimeout(poll, 3000);

  }, [cleanupPolling]);


  useEffect(() => {
    return () => {
      cleanupPolling();
    };
  }, [cleanupPolling]);


  const handleFormSubmit = async (data: TravelPreference) => {
    setAppState('loading');
    setError(null);
    setItinerary(null);
    setSessionId(null);
    
    const result = await generateItinerary(data);

    if (result.success) {
      setSessionId(result.sessionId);
      startPolling(result.sessionId);
    } else {
      console.error("Error from generateItinerary action:", result.error);
      setError(result.error);
      setAppState('error');
    }
  };
  
  const resetApp = () => {
    setItinerary(null);
    setError(null);
    setSessionId(null);
    setAppState('initial');
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
        {appState === 'initial' && (
            <div className="text-center space-y-6">
                 <p className="text-xl text-muted-foreground">Ready for your next adventure? Let our AI craft a personalized itinerary just for you.</p>
                <Button size="lg" onClick={() => setAppState('form')}>
                    Get Started
                </Button>
            </div>
        )}

        {appState === 'form' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Plan Your Next Adventure</CardTitle>
              <CardDescription>Fill out the form below to generate a custom itinerary.</CardDescription>
            </CardHeader>
            <CardContent>
              <TravelPreferenceForm onSubmit={handleFormSubmit} isPending={appState === 'loading'} />
            </CardContent>
          </Card>
        )}

        {appState === 'loading' && (
          <LoadingAnimation />
        )}
        
        {appState === 'error' && (
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

        {appState === 'result' && itinerary && (
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
