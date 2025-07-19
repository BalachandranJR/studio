
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PlaneTakeoff, Loader2 } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { format } from "date-fns";

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

const LoadingAnimation = () => {
    const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));
    const [emblaRef] = useEmblaCarousel({ loop: true }, [autoplay.current]);

    const quotes = [
        { quote: "Travel is the only thing you buy that makes you richer.", author: "Anonymous" },
        { quote: "The world is a book and those who do not travel read only one page.", author: "Saint Augustine" },
        { quote: "Life is short and the world is wide.", author: "Simon Raven" },
        { quote: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
        { quote: "Take only memories, leave only footprints.", author: "Chief Seattle" },
        { quote: "Jobs fill your pocket, but adventures fill your soul.", author: "Jaime Lyn Beatty" },
        { quote: "Travel far, travel wide, and travel often.", author: "Anonymous" },
        { quote: "Wherever you go becomes a part of you somehow.", author: "Anita Desai" },
        { quote: "Travel isn’t always pretty. It isn’t always comfortable. But that’s okay.", author: "Anthony Bourdain" },
        { quote: "Collect moments, not things.", author: "Aarti Khurana" },
        { quote: "We travel not to escape life, but for life not to escape us.", author: "Anonymous" },
        { quote: "To travel is to live.", author: "Hans Christian Andersen" },
        { quote: "Once a year, go someplace you’ve never been before.", author: "Dalai Lama" },
        { quote: "Adventure may hurt you, but monotony will kill you.", author: "Anonymous" },
        { quote: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
    ];

    return (
        <Card className="overflow-hidden">
             <CardContent className="p-0">
                <div className="bg-muted text-muted-foreground py-12">
                  <div className="overflow-hidden" ref={emblaRef}>
                      <div className="flex">
                          {quotes.map((item, index) => (
                              <div className="relative min-w-0 flex-[0_0_100%] px-8" key={index}>
                                  <div className="text-center h-40 flex flex-col justify-center">
                                      <blockquote className="text-xl font-semibold italic text-foreground">
                                          “{item.quote}”
                                      </blockquote>
                                      <cite className="mt-4 text-sm not-italic">— {item.author}</cite>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                </div>
                <div className="p-6 text-center space-y-2 border-t bg-background">
                    <h3 className="text-2xl font-semibold flex items-center justify-center gap-2">
                         <Loader2 className="w-6 h-6 animate-spin" />
                         Generating your custom itinerary...
                    </h3>
                    <p className="text-muted-foreground">Our AI is planning your perfect trip. This may take a minute or two.</p>
                </div>
            </CardContent>
        </Card>
    );
};


export default function Home() {
  const [appState, setAppState] = useState<'initial' | 'form' | 'loading' | 'result' | 'error'>('initial');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [submittedPreferences, setSubmittedPreferences] = useState<TravelPreference | null>(null);
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
                // If there's no result yet, continue polling
                pollingIntervalRef.current = setTimeout(poll, 3000);
            }
        } catch (err) {
            cleanupPolling();
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during polling.";
            setError(errorMessage);
            setAppState('error');
        }
    };
    
    // Start the first poll
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
    
    // **THE FIX**: Convert dates to 'YYYY-MM-DD' strings before processing.
    // This removes all timezone ambiguity.
    const processedData = {
      ...data,
      dates: {
        from: format(data.dates.from, 'yyyy-MM-dd'),
        to: format(data.dates.to, 'yyyy-MM-dd'),
      },
    };
    
    // We store the original form data (with Date objects) for the summary display
    setSubmittedPreferences(data);
    
    // We send the timezone-free string data to the backend action
    const result = await generateItinerary(processedData);

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
    setSubmittedPreferences(null);
    setAppState('form'); // Go back to form, not initial screen
    cleanupPolling();
  };
  
  const startForm = () => {
    setAppState('form');
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
        {appState === 'initial' && (
            <div className="text-center space-y-6 bg-card border rounded-lg p-8">
                 <h2 className="text-2xl font-semibold">Ready for your next adventure?</h2>
                 <p className="text-lg text-muted-foreground">Let our AI craft a personalized itinerary just for you.</p>
                <Button size="lg" onClick={startForm}>
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

        {appState === 'result' && itinerary && submittedPreferences && (
          <div className="mt-8 space-y-8">
            <ItineraryDisplay itinerary={itinerary} preferences={submittedPreferences} onRestart={resetApp} />
          </div>
        )}
      </div>
       <footer className="text-center mt-16 text-sm text-muted-foreground">
        <p>Powered by AI. Double-check all reservations and opening times before you travel.</p>
      </footer>
    </main>
  );
}
