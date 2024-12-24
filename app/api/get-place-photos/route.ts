import { NextRequest, NextResponse } from 'next/server';

interface PlacePhoto {
  photo_reference: string;
}

// Use the server-side API key for Places API
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// 12 hours in seconds
const CACHE_MAX_AGE = 60 * 60 * 12;

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

    console.log('Received request for:', { name, address });

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
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
