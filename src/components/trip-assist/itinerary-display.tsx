
"use client";

import { format, parseISO } from "date-fns";
import { Download, RotateCcw, Calendar as CalendarIcon, Clock } from "lucide-react";

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
import type { Itinerary } from "@/lib/types";

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  onRestart: () => void;
}

export function ItineraryDisplay({ itinerary, onRestart }: ItineraryDisplayProps) {
  const handleDownload = () => {
    window.print();
  };

  return (
    <>
      <div className="printable-area">
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
            <Accordion type="single" collapsible defaultValue="day-1" className="w-full">
              {itinerary.days.map((day) => (
                <AccordionItem value={`day-${day.day}`} key={day.day}>
                  <AccordionTrigger className="font-headline text-lg">
                    Day {day.day}: {day.date}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-4 border-l-2 border-primary/50 ml-2">
                      {day.activities.map((activity, index) => (
                        <div key={index} className="relative flex items-start gap-4">
                           <div className="absolute top-1 -left-[1.2rem] h-6 w-6 bg-background flex items-center justify-center rounded-full">
                              <span className="h-5 w-5 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                                <ItineraryIcon type={activity.type} icon={activity.icon} className="h-3 w-3" />
                              </span>
                           </div>
                          <div className="flex-1">
                            <p className="font-semibold flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {activity.time}
                            </p>
                            <p className="text-muted-foreground pl-6">{activity.description}</p>
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
