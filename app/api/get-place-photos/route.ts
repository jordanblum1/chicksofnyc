import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache
const PHOTO_CACHE: { [key: string]: { photos: string[], timestamp: number } } = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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
    const name = request.nextUrl.searchParams.get('name');
    const address = request.nextUrl.searchParams.get('address');
    const isDeployment = process.env.VERCEL_ENV !== undefined;

    console.log(`[PHOTOS] Processing request for: "${name}" at "${address}"`);

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      );
    }

    const cacheKey = `${name}-${address}`;
    const now = Date.now();

    // Check cache first
    if (PHOTO_CACHE[cacheKey] && (now - PHOTO_CACHE[cacheKey].timestamp) < CACHE_DURATION) {
      const duration = Math.round(performance.now() - startTime);
      const cacheAge = Math.round((now - PHOTO_CACHE[cacheKey].timestamp) / (1000 * 60 * 60));
      console.log(`[PHOTOS CACHE HIT] "${name}" - Duration: ${duration}ms`);
      console.log(`[PHOTOS CACHE AGE] ${cacheAge} hours old`);
      console.log(`[PHOTOS COUNT] ${PHOTO_CACHE[cacheKey].photos.length} photos`);
      
      return NextResponse.json(
        { 
          photos: PHOTO_CACHE[cacheKey].photos,
          fromCache: true,
          cacheAge: now - PHOTO_CACHE[cacheKey].timestamp,
          duration 
        },
        {
          headers: {
            'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate`,
            'CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
            'Vercel-CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
          }
        }
      );
    }

    // Only fetch new photos during deployment or if no cache exists
    if (!isDeployment && PHOTO_CACHE[cacheKey]) {
      const duration = Math.round(performance.now() - startTime);
      const cacheAge = Math.round((now - PHOTO_CACHE[cacheKey].timestamp) / (1000 * 60 * 60));
      console.log(`[PHOTOS STALE CACHE] "${name}" - Duration: ${duration}ms`);
      console.log(`[PHOTOS CACHE AGE] ${cacheAge} hours old`);
      console.log(`[PHOTOS COUNT] ${PHOTO_CACHE[cacheKey].photos.length} photos`);
      
      return NextResponse.json(
        { 
          photos: PHOTO_CACHE[cacheKey].photos,
          fromCache: true,
          isStale: true,
          cacheAge: now - PHOTO_CACHE[cacheKey].timestamp,
          duration 
        },
        {
          headers: {
            'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate`,
            'CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
            'Vercel-CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
          }
        }
      );
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

    // Update cache
    PHOTO_CACHE[cacheKey] = {
      photos: photoUrls,
      timestamp: now
    };

    const duration = Math.round(performance.now() - startTime);
    console.log(`[PHOTOS COMPLETE] Duration: ${duration}ms`);

    return NextResponse.json(
      { 
        photos: photoUrls,
        fromCache: false,
        duration 
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate`,
          'CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
        }
      }
    );
  } catch (error) {
    console.error('[PHOTOS ERROR] Failed to fetch photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
} 
