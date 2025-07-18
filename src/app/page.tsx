
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PlaneTakeoff, Loader2, Send } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';

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
    const [emblaRef] = useEmblaCarousel({ loop: true });

    const slides = [
        {
            image: "https://images.unsplash.com/photo-1520106212290-d5a2862e7453?q=80&w=1800",
            hint: "city skyline",
            title: "Finding the best spots...",
            description: "Our AI is analyzing thousands of locations to find the perfect match for your interests."
        },
        {
            image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1800",
            hint: "food market",
            title: "Crafting your culinary journey...",
            description: "We're picking out the best restaurants and local eateries based on your preferences."
        },
        {
            image: "https://images.unsplash.com/photo-1542359649-31e03cdde4fe?q=80&w=1800",
            hint: "historic landmark",
            title: "Planning your daily activities...",
            description: "Each day is being filled with exciting activities, from famous landmarks to hidden gems."
        },
        {
            image: "https://images.unsplash.com/photo-1528732263441-2b990b561e1b?q=80&w=1800",
            hint: "travel map",
            title: "Finalizing the details...",
            description: "Just a few more moments while we put the finishing touches on your personalized trip."
        }
    ];

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex">
                        {slides.map((slide, index) => (
                            <div className="relative min-w-0 flex-[0_0_100%]" key={index}>
                                <Image
                                    src={slide.image}
                                    alt={slide.title}
                                    width={600}
                                    height={400}
                                    className="w-full h-auto aspect-[3/2] object-cover"
                                    data-ai-hint={slide.hint}
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-6 text-white">
                                    <h3 className="text-xl font-bold">{slide.title}</h3>
                                    <p className="text-sm text-white/80">{slide.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 text-center space-y-2">
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
    setSubmittedPreferences(data);
    
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
