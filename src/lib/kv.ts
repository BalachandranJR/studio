import { createClient } from '@vercel/kv';

// Initialize the KV client.
// The check for environment variables is moved to the API route
// to prevent build failures if they are not set.
export const kv = createClient({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});
