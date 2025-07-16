"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, Edit, Loader2, Calendar as CalendarIcon, Clock, Briefcase } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { reviseItinerary } from "@/app/actions";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Itinerary } from "@/lib/types";

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  setItinerary: React.Dispatch<React.SetStateAction<Itinerary | null>>;
}

const revisionFormSchema = z.object({
  feedback: z.string().min(10, "Please provide at least 10 characters of feedback."),
});

type RevisionFormValues = z.infer<typeof revisionFormSchema>;

export function ItineraryDisplay({ itinerary, setItinerary }: ItineraryDisplayProps) {
  const [isRevising, setIsRevising] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const { toast } = useToast();

  const handleDownload = () => {
    window.print();
  };
  
  const form = useForm<RevisionFormValues>({
    resolver: zodResolver(revisionFormSchema),
    defaultValues: { feedback: "" },
  });

  const onRevisionSubmit = async (values: RevisionFormValues) => {
    setIsRevising(true);
    const result = await reviseItinerary({
      itineraryId: itinerary.id,
      feedback: values.feedback,
    });

    if (result.success) {
      setItinerary(result.itinerary);
      toast({
        title: "Itinerary Revised!",
        description: "Your itinerary has been updated based on your feedback.",
      });
      setIsRevisionOpen(false);
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Revision Failed",
        description: result.error,
      });
    }
    setIsRevising(false);
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
            <Dialog open={isRevisionOpen} onOpenChange={setIsRevisionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Request Revision
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request a Revision</DialogTitle>
                  <DialogDescription>
                    Let us know what you'd like to change, and we'll generate a new version of your itinerary.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onRevisionSubmit)} id="revision-form">
                    <FormField
                      control={form.control}
                      name="feedback"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Feedback</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., 'Could we add more outdoor activities on Day 2?' or 'I'd prefer Italian restaurants.'"
                              {...field}
                              rows={5}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost" disabled={isRevising}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit" form="revision-form" disabled={isRevising}>
                    {isRevising && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Revision
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
