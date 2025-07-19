
"use client";

import { useState } from "react";
import { format, parse, addDays, differenceInDays, isValid } from "date-fns";
import { Download, RotateCcw, Calendar as CalendarIcon, Clock, MapPin, DollarSign, Bus, Users, Utensils, Sparkles, Wallet, Plane, Home, CreditCard, Info } from "lucide-react";

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

const ActivityDetail = ({ icon: Icon, label, value, note }: { icon: React.ElementType, label: string, value?: string | number, note?: string }) => {
  if (!value && value !== 0) return null;
  const displayValue = typeof value === 'number' && label.toLowerCase() === 'cost' ? `$${value}` : value;
  return (
    <div className="flex items-start text-xs text-muted-foreground mt-1">
      <Icon className="h-3 w-3 mr-2 mt-0.5 shrink-0" />
      <span className="font-semibold mr-1">{label}:</span>
      <span>{displayValue} {note && <span className="italic">({note})</span>}</span>
    </div>
  );
};

const ActivityCard = ({ activity }: { activity: Activity }) => {
    return (
        <div className="relative flex items-start gap-4">
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
                    <ActivityDetail icon={Info} label="Notes" value={activity.notes} />
                </div>
            </div>
        </div>
    );
};

const DaySection = ({ title, activities }: { title: string, activities: (Activity | null | undefined)[] }) => {
  const validActivities = activities.filter((a): a is Activity => !!a);
  if (validActivities.length === 0) return null;

  return (
    <div className="space-y-4 py-4">
      <h4 className="font-semibold text-md text-primary">{title}</h4>
      <div className="space-y-4 pl-4 border-l-2 border-primary/50 ml-2">
        {validActivities.map((activity, index) => (
          <ActivityCard key={index} activity={activity} />
        ))}
      </div>
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
  ].filter(item => typeof item.value !== 'undefined' && item.value !== null);
  
  const totalCost = costBreakdown.total ?? "N/A";

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
                <span className="font-medium">${item.value}</span>
              </li>
            ))}
          </ul>
          <hr className="my-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Grand Total</span>
            <span>${totalCost}</span>
          </div>
          {costBreakdown.notes && (
            <p className="text-xs text-muted-foreground mt-4">{costBreakdown.notes}</p>
          )}
      </CardContent>
    </Card>
  );
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Handle ISO 8601 format (e.g., "2025-07-19T00:00:00.000Z")
  let date = new Date(dateStr);
  if (isValid(date)) return date;

  // Handle formatted string "July 19, 2025"
  date = parse(dateStr, 'MMMM d, yyyy', new Date());
  if (isValid(date)) return date;
  
  // Handle formatted string "yyyy-MM-dd"
  date = parse(dateStr, 'yyyy-MM-dd', new Date());
  if (isValid(date)) return date;
  
  return null;
}

export function ItineraryDisplay({ itinerary, preferences, onRestart }: ItineraryDisplayProps) {
  const [openDays, setOpenDays] = useState<string[]>(['day-1']);
  
  const startDate = parseDate(itinerary.startDate);
  const endDate = parseDate(itinerary.endDate);
  
  const handleDownload = () => {
    if (!startDate || !endDate) return;
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const allDayKeys = Array.from({ length: totalDays }, (_, index) => `day-${index + 1}`);
    setOpenDays(allDayKeys);

    setTimeout(() => {
        window.print();
    }, 100);
  };


  if (!startDate || !endDate) {
    return <Card><CardHeader><CardTitle>Error</CardTitle><CardDescription>Invalid date format in itinerary data.</CardDescription></CardHeader></Card>
  }
  
  const totalDays = differenceInDays(endDate, startDate) + 1;

  const allDays = Array.from({ length: totalDays }, (_, i) => {
      const currentDate = addDays(startDate, i);
      const currentDateStr = format(currentDate, 'yyyy-MM-dd');
      
      const itineraryDay = itinerary.days.find(d => {
          if (!d.date) return false;
          const dayDate = parseDate(d.date);
          return dayDate ? format(dayDate, 'yyyy-MM-dd') === currentDateStr : false;
      });

      return {
          dayNumber: i + 1,
          date: format(currentDate, "MMM d, yyyy"),
          data: itineraryDay,
      };
  });
  
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
                    {format(startDate, "MMM d, yyyy")} - {" "}
                    {format(endDate, "MMM d, yyyy")}
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
                    {allDays.map(({ dayNumber, date, data: day }) => {
                       const dayBreakdown = day?.breakdown;
                       const flatActivities = day?.activities || [];
                       
                       const hasContent = (dayBreakdown && (
                          dayBreakdown.breakfast ||
                          (dayBreakdown.morningActivities && dayBreakdown.morningActivities.length > 0) ||
                          dayBreakdown.lunch ||
                          (dayBreakdown.afternoonActivities && dayBreakdown.afternoonActivities.length > 0) ||
                          dayBreakdown.dinner ||
                          (dayBreakdown.nightlifeActivities && dayBreakdown.nightlifeActivities.length > 0)
                       )) || flatActivities.length > 0;

                       return (
                        <AccordionItem value={`day-${dayNumber}`} key={dayNumber}>
                        <AccordionTrigger className="font-headline text-lg">
                            Day {dayNumber}: {date}
                        </AccordionTrigger>
                        <AccordionContent>
                           {hasContent ? (
                                dayBreakdown ? (
                                  <div className="divide-y">
                                    <DaySection title="Morning" activities={[dayBreakdown.breakfast, ...(dayBreakdown.morningActivities || [])]} />
                                    <DaySection title="Afternoon" activities={[dayBreakdown.lunch, ...(dayBreakdown.afternoonActivities || [])]} />
                                    <DaySection title="Evening" activities={[dayBreakdown.dinner, ...(dayBreakdown.nightlifeActivities || [])]} />
                                  </div>
                                ) : (
                                  <div className="space-y-4 py-4 pl-4 border-l-2 border-primary/50 ml-2">
                                      {flatActivities.map((activity, index) => (
                                          <ActivityCard key={index} activity={activity} />
                                      ))}
                                  </div>
                                )
                            ) : (
                              <div className="pl-4 text-muted-foreground italic py-4">No activities planned for this day.</div>
                            )}
                        </AccordionContent>
                        </AccordionItem>
                       );
                    })}
                    </Accordion>
                </CardContent>
                </Card>
            </div>
        </div>
      </div>
      <div className="no-print pt-6">
        <CardFooter className="flex-col md:flex-row gap-2 items-center justify-center border-t pt-6">
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
        <Skeleton className="h-5 w-32 rounded-full mx-auto" />
        <Skeleton className="h-9 w-3/4 mt-2 rounded-md mx-auto" />
        <Skeleton className="h-5 w-1/2 mt-2 rounded-md mx-auto" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-md p-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-16 w-full mt-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-center gap-2">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  );
}
