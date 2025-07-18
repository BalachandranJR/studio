
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldErrors } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Car, Loader2, MapPin, Plane, Train, Users, Utensils, Sprout, WheatOff, Star, MilkOff, HandPlatter, Check, ChevronsUpDown } from "lucide-react";

import { travelPreferenceSchema, type TravelPreference, ageGroups, areasOfInterest, foodPreferences, transportOptions } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'BRL', label: 'BRL - Brazilian Real' },
    { value: 'RUB', label: 'RUB - Russian Ruble' },
    { value: 'ZAR', label: 'ZAR - South African Rand' },
    { value: 'MXN', label: 'MXN - Mexican Peso' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
    { value: 'NZD', label: 'NZD - New Zealand Dollar' },
    { value: 'SEK', label: 'SEK - Swedish Krona' },
    { value: 'NOK', label: 'NOK - Norwegian Krone' },
    { value: 'KRW', label: 'KRW - South Korean Won' },
    { value: 'TRY', label: 'TRY - Turkish Lira' },
    { value: 'OTHER', label: 'Other...' },
];

export function TravelPreferenceForm({ onSubmit, isPending }: TravelPreferenceFormProps) {
  const form = useForm<TravelPreference>({
    resolver: zodResolver(travelPreferenceSchema),
    defaultValues: {
      destination: "",
      numPeople: "1",
      ageGroups: [],
      interests: [],
      otherInterests: "",
      budget: {
        currency: 'USD',
        amount: "1000",
        otherCurrency: "",
      },
      transport: [],
      otherTransport: "",
      foodPreferences: [],
      otherFoodPreferences: "",
    },
  });

  const watchedCurrency = form.watch("budget.currency");

  function onFormSubmit(data: TravelPreference) {
    onSubmit(data);
  }

  function onFormError(errors: FieldErrors<TravelPreference>) {
    // Define the order of fields as they appear in the form
    const fieldOrder: (keyof TravelPreference | `budget.${keyof TravelPreference['budget']}` | `dates.${keyof NonNullable<TravelPreference['dates']>}`)[] = [
      'destination', 'dates.from', 'dates.to', 'numPeople', 'ageGroups', 
      'interests', 'budget.currency', 'budget.amount', 'budget.otherCurrency',
      'transport'
    ];
    
    // Find the first field name that has an error
    const firstErrorField = fieldOrder.find(fieldName => {
        if (fieldName.includes('.')) {
            const [parent, child] = fieldName.split('.');
            return errors[parent as keyof TravelPreference]?.[child as keyof object];
        }
        return errors[fieldName as keyof TravelPreference];
    });

    if (firstErrorField) {
      // Find the corresponding HTML element
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        // Scroll the element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit, onFormError)} className="space-y-8">
        
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
                  <FormItem>
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

        <Separator />

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
                      <Input type="number" placeholder="e.g., 2" {...field} className="pl-10" />
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
                          <FormControl>
                              <Combobox
                                  options={currencies}
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select currency..."
                              />
                          </FormControl>
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
                          <Input type="number" placeholder="Approximate budget per person" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            </div>
             {watchedCurrency === 'OTHER' && (
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="budget.otherCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., THB" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />
        
        <Card className="border-none shadow-none">
            <CardHeader className="px-2">
                <CardTitle>Transport Preference</CardTitle>
                <CardDescription>Select all that apply.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-2">
                <FormField
                  control={form.control}
                  name="transport"
                  render={() => (
                      <FormItem>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {transportOptions.map((item) => (
                            <FormField
                                key={item.id}
                                control={form.control}
                                name="transport"
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
                    name="otherTransport"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Other Transport</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Tell us about any other transport preferences..."
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

    