
"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, RotateCcw, Calendar as CalendarIcon, Clock, MapPin, DollarSign, Bus, Users, Utensils, Sparkles, Wallet, Plane } from "lucide-react";

import { ItineraryIcon } from "@/components/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Itinerary, Activity, TravelPreference } from "@/lib/types";
import { ageGroups, areasOfInterest, transportOptions, foodPreferences } from "@/lib/types";

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  preferences: TravelPreference;
  onRestart: () => void;
}

const ActivityDetail = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start text-xs text-muted-foreground mt-1">
      <Icon className="h-3 w-3 mr-2 mt-0.5 shrink-0" />
      <span className="font-semibold mr-1">{label}:</span>
      <span>{value}</span>
    </div>
  );
};

const SummaryDetail = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) => {
    return (
        <div className="flex items-start">
            <Icon className="h-5 w-5 mr-3 mt-1 text-primary shrink-0" />
            <div>
                <p className="font-semibold text-sm">{label}</p>
                <div className="text-muted-foreground text-sm">{value}</div>
            </div>
        </div>
    );
};

const TripSummary = ({ preferences }: { preferences: TravelPreference }) => {
    const getLabels = (ids: string[] | undefined, options: readonly {id: string, label: string}[]) => {
        if (!ids || ids.length === 0) return 'None specified';
        return ids.map(id => options.find(opt => opt.id === id)?.label).filter(Boolean).join(', ');
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Trip Summary</CardTitle>
                <CardDescription>A summary of the preferences used for this itinerary.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SummaryDetail icon={Users} label="Travelers" value={`${preferences.numPeople} person(s) - ${getLabels(preferences.ageGroups, ageGroups)}`} />
                    <SummaryDetail icon={Wallet} label="Budget" value={`${preferences.budget.amount} ${preferences.budget.currency} per person`} />
                    <SummaryDetail icon={Plane} label="Transport" value={getLabels(preferences.transport, transportOptions)} />
                    <SummaryDetail icon={Sparkles} label="Interests" value={getLabels(preferences.interests, areasOfInterest)} />
                    <SummaryDetail icon={Utensils} label="Food Preferences" value={getLabels(preferences.foodPreferences, foodPreferences)} />
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Parses a time string (e.g., "9:00 AM", "1 PM", "Morning") into a number of minutes
 * from midnight for sorting purposes. Handles various formats gracefully.
 * @param timeStr The time string to parse.
 * @returns A number representing minutes from midnight, or a large number for unrecognized formats.
 */
function parseTimeToMinutes(timeStr: string | undefined): number {
    if (!timeStr) return 9999; // Sort undefined times to the end.

    const lowerTime = timeStr.toLowerCase();

    // Handle general time descriptions
    if (lowerTime.includes('morning')) return 8 * 60;   // 8:00 AM
    if (lowerTime.includes('lunch')) return 12 * 60;  // 12:00 PM
    if (lowerTime.includes('afternoon')) return 14 * 60; // 2:00 PM
    if (lowerTime.includes('evening') || lowerTime.includes('dinner')) return 19 * 60; // 7:00 PM
    if (lowerTime.includes('night')) return 21 * 60;   // 9:00 PM

    // Handle specific times like "9:00 AM", "13:00", "1pm"
    const match = lowerTime.match(/(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?/);
    if (!match) {
        return 9998; // Sort unrecognized specific times just before undefined ones.
    }

    let [_, hoursStr, minutesStr, period] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

    // If parsing fails for some reason, return a default sort value.
    if (isNaN(hours)) {
        return 9997;
    }

    if (period === 'pm' && hours !== 12) {
        hours += 12;
    } else if (period === 'am' && hours === 12) { // Midnight case
        hours = 0;
    }

    // Ensure hours are within a 24-hour range
    if (hours >= 24) hours = 23;

    return hours * 60 + minutes;
}


export function ItineraryDisplay({ itinerary, preferences, onRestart }: ItineraryDisplayProps) {
  const [openDays, setOpenDays] = useState<string[]>(['day-1']);
  
  const handleDownload = () => {
    // Before printing, open all accordions
    const allDayKeys = itinerary.days.map(day => `day-${day.day}`);
    setOpenDays(allDayKeys);

    // Allow state to update and then print
    setTimeout(() => {
        window.print();
    }, 100);
  };
  
  // Create a sorted version of the itinerary without mutating the original prop
  const sortedItinerary = {
      ...itinerary,
      days: itinerary.days.map(day => ({
          ...day,
          // Use the robust parsing function to sort activities chronologically
          activities: [...day.activities].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)),
      })),
  };

  return (
    <>
      <div className="printable-area space-y-8">
        <TripSummary preferences={preferences} />
        <Card className="w-full">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Trip Itinerary</Badge>
            <CardTitle className="font-headline text-3xl mt-2">
              Your Trip to {itinerary.destination}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 pt-2">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {format(parseISO(itinerary.startDate), "MMM d, yyyy")} - {" "}
                {format(parseISO(itinerary.endDate), "MMM d, yyyy")}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" value={openDays} onValueChange={setOpenDays} className="w-full">
              {sortedItinerary.days.map((day, dayIndex) => (
                <AccordionItem value={`day-${day.day}`} key={dayIndex}>
                  <AccordionTrigger className="font-headline text-lg">
                    Day {day.day}: {day.date}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-4 border-l-2 border-primary/50 ml-2">
                      {day.activities.map((activity, activityIndex) => (
                        <div key={activityIndex} className="relative flex items-start gap-4">
                           <div className="absolute top-1 -left-[1.2rem] h-6 w-6 bg-background flex items-center justify-center rounded-full">
                              <span className="h-5 w-5 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                                <ItineraryIcon type={activity.type} icon={activity.icon} className="h-3 w-3" />
                              </span>
                           </div>
                          <div className="flex-1">
                            <p className="font-semibold flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {activity.time} - {activity.name || "Activity"}
                            </p>
                            <p className="text-muted-foreground pl-6">{activity.description}</p>
                            <div className="pl-6 mt-2 space-y-1">
                                <ActivityDetail icon={MapPin} label="Location" value={activity.location} />
                                <ActivityDetail icon={DollarSign} label="Cost" value={activity.cost} />
                                <ActivityDetail icon={Bus} label="Transport" value={activity.transport} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
          <CardFooter className="flex-col md:flex-row gap-2 items-center justify-end no-print">
            <Button variant="outline" onClick={onRestart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Start New Plan
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

export function ItinerarySkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-9 w-3/4 mt-2 rounded-md" />
        <Skeleton className="h-5 w-1/2 mt-2 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-md p-4">
            <Skeleton className="h-6 w-1/3" />
          </div>
        ))}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  );
}
