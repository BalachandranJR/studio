
"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, RotateCcw, Calendar as CalendarIcon, Clock, MapPin, DollarSign, Bus, Users, Utensils, Sparkles, Wallet, Plane, Home, CreditCard } from "lucide-react";

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
                <CardTitle>Your Trip Preferences</CardTitle>
                <CardDescription>This itinerary was generated based on the following preferences.</CardDescription>
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

const AccommodationDetails = ({ accommodation }: { accommodation?: Itinerary['accommodation'] }) => {
  if (!accommodation) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Home className="w-6 h-6 text-primary" /> Accommodation</CardTitle>
        <CardDescription>Your recommended place to stay.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{accommodation.name}</h3>
          <p className="text-sm text-muted-foreground">{accommodation.type} in {accommodation.location}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span><span className="font-semibold">Cost:</span> {accommodation.costPerNight} / night</span>
          </div>
          <div className="flex items-center gap-2">
             <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span><span className="font-semibold">Total:</span> {accommodation.totalCost}</span>
          </div>
        </div>
        {accommodation.amenities && accommodation.amenities.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {accommodation.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary">{amenity}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CostBreakdown = ({ costBreakdown }: { costBreakdown?: Itinerary['costBreakdown'] }) => {
  if (!costBreakdown) return null;
  
  const breakdownItems = [
    { label: "Accommodation", value: costBreakdown.accommodation },
    { label: "Transport", value: costBreakdown.transport },
    { label: "Meals", value: costBreakdown.meals },
    { label: "Activities", value: costBreakdown.activities },
    { label: "Nightlife", value: costBreakdown.nightlife },
  ].filter(item => item.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" /> Estimated Cost Breakdown</CardTitle>
        <CardDescription>An approximate budget for your trip.</CardDescription>
      </CardHeader>
      <CardContent>
          <ul className="space-y-2 text-sm">
            {breakdownItems.map(item => (
              <li key={item.label} className="flex justify-between">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </li>
            ))}
          </ul>
          <hr className="my-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Grand Total</span>
            <span>{costBreakdown.total}</span>
          </div>
          {costBreakdown.notes && (
            <p className="text-xs text-muted-foreground mt-4">{costBreakdown.notes}</p>
          )}
      </CardContent>
    </Card>
  );
};

function parseTimeToMinutes(timeStr: string | undefined): number {
    if (!timeStr) return 9999; 

    const lowerTime = timeStr.toLowerCase().trim();

    const timeMap: { [key: string]: number } = {
        'early morning': 6 * 60,
        'morning': 9 * 60,
        'late morning': 11 * 60,
        'lunch': 12 * 60,
        'afternoon': 14 * 60,
        'late afternoon': 16 * 60,
        'evening': 18 * 60,
        'dinner': 19 * 60,
        'night': 21 * 60,
        'late night': 23 * 60,
        'full day': 1, // Sort full day activities first
        'all day': 1,
    };
    if (timeMap[lowerTime]) {
        return timeMap[lowerTime];
    }
    
    const match = lowerTime.match(/(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?/);
    if (!match) {
        return 9998; 
    }

    let [_, hoursStr, minutesStr, period] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

    if (isNaN(hours)) {
        return 9997;
    }

    if (period === 'pm' && hours < 12) {
        hours += 12;
    } else if (period === 'am' && hours === 12) { // Midnight case: 12am -> 00:00
        hours = 0;
    }

    return hours * 60 + minutes;
}


export function ItineraryDisplay({ itinerary, preferences, onRestart }: ItineraryDisplayProps) {
  const [openDays, setOpenDays] = useState<string[]>(['day-1']);
  
  const handleDownload = () => {
    const allDayKeys = itinerary.days.map(day => `day-${day.day}`);
    setOpenDays(allDayKeys);

    setTimeout(() => {
        window.print();
    }, 100);
  };
  
  const sortedItinerary = {
      ...itinerary,
      days: itinerary.days.map(day => ({
          ...day,
          activities: [...day.activities].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)),
      })),
  };

  return (
    <>
      <div className="printable-area space-y-8">
        <Card className="w-full">
            <CardHeader className="text-center">
                <Badge variant="secondary" className="w-fit mx-auto">Your Custom Itinerary</Badge>
                <CardTitle className="font-headline text-3xl md:text-4xl mt-2">
                Your Trip to {itinerary.destination}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-2 pt-2">
                <CalendarIcon className="h-4 w-4" />
                <span>
                    {format(parseISO(itinerary.startDate), "MMM d, yyyy")} - {" "}
                    {format(parseISO(itinerary.endDate), "MMM d, yyyy")}
                </span>
                </CardDescription>
            </CardHeader>
        </Card>
        
        <TripSummary preferences={preferences} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <AccommodationDetails accommodation={itinerary.accommodation} />
                <CostBreakdown costBreakdown={itinerary.costBreakdown} />
            </div>

            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Schedule</CardTitle>
                        <CardDescription>A day-by-day plan for your adventure.</CardDescription>
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
                </Card>
            </div>
        </div>

        <CardFooter className="flex-col md:flex-row gap-2 items-center justify-center no-print border-t pt-6">
            <Button variant="outline" onClick={onRestart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Start New Plan
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Itinerary
            </Button>
        </CardFooter>
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
