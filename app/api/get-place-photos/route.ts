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
  console.log('Searching for place:', query);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      query
    )}&inputtype=textquery&fields=place_id&key=${PLACES_API_KEY}`
  );
  const data = await response.json();
  console.log('Place search response:', data);
  return data.candidates[0]?.place_id;
}

async function getPlaceDetails(placeId: string) {
  console.log('Fetching details for place ID:', placeId);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${PLACES_API_KEY}`
  );
  const data = await response.json();
  console.log('Place details response:', data);
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
    console.error('Error fetching photo:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get('name');
    const address = request.nextUrl.searchParams.get('address');
    const isDeployment = process.env.VERCEL_ENV !== undefined;

    console.log('Received request for:', { name, address });

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
      console.log('Returning cached photos for:', cacheKey);
      return NextResponse.json(
        { photos: PHOTO_CACHE[cacheKey].photos },
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
      console.log('Returning stale cached photos for:', cacheKey);
      return NextResponse.json(
        { 
          photos: PHOTO_CACHE[cacheKey].photos,
          isStale: true 
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

    const query = `${name} ${address}`;
    const placeId = await getPlaceId(query);

    console.log('Found place ID:', placeId);

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
    }

    const photos = await getPlaceDetails(placeId);
    console.log('Found photos:', photos.length);

    const photoUrls = await Promise.all(
      photos
        .slice(0, 6)
        .map((photo: PlacePhoto) => getPhotoUrl(photo.photo_reference))
    ).then(urls => urls.filter((url): url is string => url !== null));

    console.log('Generated photo URLs:', photoUrls.length);

    // Update cache
    PHOTO_CACHE[cacheKey] = {
      photos: photoUrls,
      timestamp: now
    };

    return NextResponse.json(
      { photos: photoUrls },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate`,
          'CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
        }
      }
    );
  } catch (error) {
    console.error('Error fetching place photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
} 
