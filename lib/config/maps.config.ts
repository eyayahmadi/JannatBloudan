// Server-side Google Maps configuration
// This should only be used in Server Components or API routes
export const GOOGLE_MAPS_CONFIG = {
  DEFAULT_CENTER: { lat: 48.8566, lng: 2.3522 } // Paris
};

// Server-side function to get API key
export function getGoogleMapsApiKey() {
  'use server';
  return process.env.GOOGLE_MAPS_API_KEY || '';
}
