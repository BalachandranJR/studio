'use server';
/**
 * @fileOverview A Genkit flow for generating travel itineraries by calling an n8n webhook.
 * 
 * - generateItineraryFlow - A function that handles the itinerary generation process.
 */

import { ai } from '@/ai/genkit';
import { travelPreferenceSchema, type TravelPreference } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export async function generateItineraryFlow(input: TravelPreference): Promise<string> {
    return itineraryFlow(input);
}

const itineraryFlow = ai.defineFlow(
    {
        name: 'itineraryFlow',
        inputSchema: travelPreferenceSchema,
        outputSchema: z.string(),
    },
    async (validatedData) => {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (!webhookUrl) {
            throw new Error(
                'The N8N_WEBHOOK_URL environment variable is not set. Please add it to your .env file.'
            );
        }

        const appUrl = process.env.APP_URL;
        if (!appUrl) {
            throw new Error('The APP_URL environment variable is not set. Please add it to your .env file.');
        }

        const sessionId = uuidv4();
        const callbackUrl = `${appUrl}/api/webhook?sessionId=${sessionId}`;

        try {
            const url = new URL(callbackUrl);
            if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
                console.error(`The APP_URL ("${appUrl}") resolves to a local address. It must be a public URL that the n8n service can reach.`);
                throw new Error(`Invalid callback URL format: The URL must be public, not local. Please update your APP_URL in the .env file.`);
            }
        } catch (urlError) {
            console.error('Invalid callback URL constructed:', callbackUrl);
            throw new Error('Failed to construct a valid callback URL. Check your APP_URL environment variable.');
        }
        
        console.log('Using App URL from environment:', appUrl);
        console.log('Generated Callback URL for n8n:', callbackUrl);

        const payload = {
            destination: validatedData.destination,
            dates: {
                from: validatedData.dates.from.toISOString(),
                to: validatedData.dates.to.toISOString(),
            },
            numPeople: validatedData.numPeople,
            ageGroups: validatedData.ageGroups,
            interests: validatedData.interests,
            otherInterests: validatedData.otherInterests,
            budget: validatedData.budget,
            transport: validatedData.transport,
            otherTransport: validatedData.otherTransport,
            foodPreferences: validatedData.foodPreferences,
            otherFoodPreferences: validatedData.otherFoodPreferences,
            callbackUrl: callbackUrl,
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error from n8n workflow:', errorBody);
            throw new Error(
                `The itinerary generation service failed with status: ${response.status} ${response.statusText}.`
            );
        }

        console.log('Successfully sent request to n8n.');

        return sessionId;
    }
);
