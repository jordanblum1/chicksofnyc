import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const CACHE_PREFIX = 'photos_';
const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

interface PlacePhoto {
  photo_reference: string;
}

// Use the server-side API key for Places API
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// 24 hours in seconds for HTTP cache
const CACHE_MAX_AGE = 60 * 60 * 24;

// Configure route for dynamic usage
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

async function getPlaceId(query: string) {
  console.log('[PLACES API] Searching for place:', query);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      query
    )}&inputtype=textquery&fields=place_id&key=${PLACES_API_KEY}`
  );
  const data = await response.json();
  console.log('[PLACES API] Search response:', data);
  return data.candidates[0]?.place_id;
}

async function getPlaceDetails(placeId: string) {
  console.log('[PLACES API] Fetching details for place ID:', placeId);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${PLACES_API_KEY}`
  );
  const data = await response.json();
  console.log('[PLACES API] Details response:', data);
  return data.result?.photos || [];
}

async function getPhotoUrl(photoReference: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photo_reference=${photoReference}&key=${PLACES_API_KEY}`,
      { redirect: 'manual' }
    );
    return response.headers.get('location');
  } catch (error) {
    console.error('[PHOTOS API] Error fetching photo:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const startTime = performance.now();
    const name = request.nextUrl.searchParams.get('name')?.trim();
    const address = request.nextUrl.searchParams.get('address')?.trim();

    console.log(`[PHOTOS] Processing request for: "${name}" at "${address}"`);

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      );
    }

    const cacheKey = `${CACHE_PREFIX}${name}-${address}`.toLowerCase();
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    // Check Redis cache first
    const cachedEntry = await kv.get(cacheKey);

    if (cachedEntry) {
      const duration = Math.round(performance.now() - startTime);
      const cacheAge = (now - (cachedEntry as any).timestamp) * 1000; // Convert to milliseconds
      const cacheHours = Math.round(cacheAge / (1000 * 60 * 60));
      console.log(`[PHOTOS CACHE HIT] "${name}" - Duration: ${duration}ms`);
      console.log(`[PHOTOS CACHE AGE] ${cacheHours} hours old`);
      console.log(`[PHOTOS COUNT] ${(cachedEntry as any).photos.length} photos`);
      
      return NextResponse.json({ 
        photos: (cachedEntry as any).photos,
        fromCache: true,
        cacheAge,
        duration 
      });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('[PHOTOS ERROR] Missing API key');
      throw new Error('Missing API key');
    }

    console.log(`[PHOTOS API CALL] Fetching fresh photos for: "${name}"`);
    const query = `${name} ${address}`;
    const placeId = await getPlaceId(query);

    if (!placeId) {
      console.error(`[PHOTOS ERROR] Place not found for: "${name}"`);
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    const photos = await getPlaceDetails(placeId);
    console.log(`[PHOTOS API] Found ${photos.length} photos for: "${name}"`);

    const photoUrls = await Promise.all(
      photos
        .slice(0, 6)
        .map((photo: PlacePhoto) => getPhotoUrl(photo.photo_reference))
    ).then(urls => urls.filter((url): url is string => url !== null));

    console.log(`[PHOTOS API] Generated ${photoUrls.length} photo URLs for: "${name}"`);

    // Cache in Redis with expiration
    await kv.set(cacheKey, {
      photos: photoUrls,
      timestamp: now
    }, {
      ex: CACHE_DURATION // Set expiration in seconds
    });

    const duration = Math.round(performance.now() - startTime);
    console.log(`[PHOTOS COMPLETE] Duration: ${duration}ms`);

    return NextResponse.json({ 
      photos: photoUrls,
      fromCache: false,
      duration 
    });
  } catch (error) {
    console.error('[PHOTOS ERROR] Failed to fetch photos:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch photos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 

