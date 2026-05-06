// Server-side Google Maps configuration
// This should only be used in Server Components or API routes
export const GOOGLE_MAPS_CONFIG = {
  DEFAULT_CENTER: { lat: 50.9792, lng: 11.0325 }, // Erfurt — Mainzer Str. area
};

// Server-side function to get API key
export function getGoogleMapsApiKey() {
  'use server';
  return process.env.GOOGLE_MAPS_API_KEY || '';
}
