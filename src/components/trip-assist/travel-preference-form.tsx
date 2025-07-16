
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Car, Loader2, MapPin, Plane, Train, Users, Utensils, Sprout, WheatOff, Star, MilkOff, HandPlatter } from "lucide-react";

import { travelPreferenceSchema, type TravelPreference, ageGroups, areasOfInterest, foodPreferences } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TravelPreferenceFormProps {
  onSubmit: (data: TravelPreference) => void;
  isPending: boolean;
}

const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'SEK', label: 'SEK - Swedish Krona' },
    { value: 'NZD', label: 'NZD - New Zealand Dollar' },
];

export function TravelPreferenceForm({ onSubmit, isPending }: TravelPreferenceFormProps) {
  const form = useForm<TravelPreference>({
    resolver: zodResolver(travelPreferenceSchema),
    defaultValues: {
      destination: "",
      numPeople: 1,
      ageGroups: [],
      interests: [],
      otherInterests: "",
      budget: {
        currency: 'USD',
        amount: 1000,
      },
      transport: "flights",
      foodPreferences: [],
      otherFoodPreferences: "",
    },
  });

  function onFormSubmit(data: TravelPreference) {
    onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
          <Card className="border-none shadow-none p-0">
            <CardHeader className="px-2">
              <CardTitle>Destination Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="e.g., Paris, France" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dates"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Travel Dates</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value?.from && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value?.from ? (
                                field.value.to ? (
                                  <>
                                    {format(field.value.from, "LLL dd, y")} -{" "}
                                    {format(field.value.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(field.value.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={field.value?.from}
                            selected={{ from: field.value?.from, to: field.value?.to }}
                            onSelect={field.onChange}
                            numberOfMonths={2}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none p-0">
            <CardHeader className="px-2">
              <CardTitle>Traveler Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-2">
              <FormField
                control={form.control}
                name="numPeople"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of People</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder="e.g., 2" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ageGroups"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Traveler Age Groups</FormLabel>
                      <FormDescription>
                        Select all that apply to help us tailor activities.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {ageGroups.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="ageGroups"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Separator />

        <Card className="border-none shadow-none">
            <CardHeader className="px-2">
                <CardTitle>Areas of Interest</CardTitle>
                <CardDescription>Select all that apply.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-2">
                <FormField
                control={form.control}
                name="interests"
                render={() => (
                    <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {areasOfInterest.map((item) => (
                        <FormField
                            key={item.id}
                            control={form.control}
                            name="interests"
                            render={({ field }) => {
                            return (
                                <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                <FormControl>
                                    <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                                (value) => value !== item.id
                                            )
                                            )
                                    }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    {item.label}
                                </FormLabel>
                                </FormItem>
                            )
                            }}
                        />
                        ))}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="otherInterests"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Other Interests</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Tell us about any other interests you have..."
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <Separator />

        <Card className="border-none shadow-none">
          <CardHeader className="px-2">
            <CardTitle>Budget Range</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="budget.currency"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="budget.amount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Approximate budget per person" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
          </CardContent>
        </Card>

        <Separator />
        
        <Card className="border-none shadow-none">
            <CardHeader className="px-2">
                <CardTitle>Transport Preference</CardTitle>
                <CardDescription>How do you prefer to travel?</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
                <FormField
                control={form.control}
                name="transport"
                render={({ field }) => (
                    <FormItem>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                        <FormItem>
                            <FormControl>
                                <RadioGroupItem value="flights" id="flights" className="sr-only" />
                            </FormControl>
                            <FormLabel htmlFor="flights">
                                <Card className={cn("cursor-pointer", field.value === "flights" && "border-primary")}>
                                    <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                                        <Plane className="h-8 w-8" />
                                        <span className="font-semibold">Flights</span>
                                    </CardContent>
                                </Card>
                            </FormLabel>
                        </FormItem>
                         <FormItem>
                            <FormControl>
                                <RadioGroupItem value="train" id="train" className="sr-only" />
                            </FormControl>
                            <FormLabel htmlFor="train">
                                <Card className={cn("cursor-pointer", field.value === "train" && "border-primary")}>
                                    <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                                        <Train className="h-8 w-8" />
                                        <span className="font-semibold">Train</span>
                                    </CardContent>
                                </Card>
                            </FormLabel>
                        </FormItem>
                         <FormItem>
                            <FormControl>
                                <RadioGroupItem value="car" id="car" className="sr-only" />
                            </FormControl>
                            <FormLabel htmlFor="car">
                                <Card className={cn("cursor-pointer", field.value === "car" && "border-primary")}>
                                    <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                                        <Car className="h-8 w-8" />
                                        <span className="font-semibold">Car</span>
                                    </CardContent>
                                </Card>
                            </FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
        </Card>

        <Separator />
        
        <Card className="border-none shadow-none">
            <CardHeader className="px-2">
                <CardTitle>Food Preferences</CardTitle>
                <CardDescription>Any dietary requirements or preferences?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-2">
                 <FormField
                    control={form.control}
                    name="foodPreferences"
                    render={() => (
                        <FormItem>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {foodPreferences.map((item) => (
                            <FormField
                                key={item.id}
                                control={form.control}
                                name="foodPreferences"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                    (value) => value !== item.id
                                                )
                                                )
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {item.label}
                                    </FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                            ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="otherFoodPreferences"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Other Food Preferences or Allergies</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="e.g., 'Allergic to peanuts' or 'Love spicy food'"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <Button type="submit" disabled={isPending} size="lg" className="w-full md:w-auto">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Itinerary...
            </>
          ) : (
            "Create My Trip"
          )}
        </Button>
      </form>
    </Form>
  );
}
