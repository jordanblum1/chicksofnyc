import { NextRequest, NextResponse } from 'next/server';

interface CacheEntry {
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: number;
}

const GEOCODE_CACHE: { [key: string]: CacheEntry } = {};
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address')?.trim();

  if (!address) {
    return NextResponse.json(
      { error: 'Address is required' },
      { status: 400 }
    );
  }

  const cacheKey = address.toLowerCase();
  const cachedEntry = GEOCODE_CACHE[cacheKey];
  const now = Date.now();

  // Check if we have a valid cached entry
  if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
    const duration = Math.round(performance.now() - startTime);
    console.log(`[GEOCODE CACHE HIT] Address: "${address}" - Duration: ${duration}ms`);
    console.log(`[GEOCODE DETAILS] Coordinates: ${JSON.stringify(cachedEntry.coordinates)}`);
    console.log(`[GEOCODE CACHE AGE] ${Math.round((now - cachedEntry.timestamp) / (1000 * 60 * 60))} hours old`);
    
    return NextResponse.json({
      coordinates: cachedEntry.coordinates,
      fromCache: true,
      cacheAge: now - cachedEntry.timestamp,
      duration,
    });
  }

  try {
    console.log(`[GEOCODE API CALL] Fetching fresh coordinates for: "${address}"`);
    // Geocode the address
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) {
      console.error(`[GEOCODE ERROR] Failed to geocode address: "${address}" - Status: ${data.status}`);
      throw new Error('Failed to geocode address');
    }

    const coordinates = data.results[0].geometry.location;
    console.log(`[GEOCODE SUCCESS] New coordinates for "${address}": ${JSON.stringify(coordinates)}`);

    // Cache the result
    GEOCODE_CACHE[cacheKey] = {
      coordinates,
      timestamp: now,
    };

    const duration = Math.round(performance.now() - startTime);
    console.log(`[GEOCODE COMPLETE] Duration: ${duration}ms`);

    return NextResponse.json({
      coordinates,
      fromCache: false,
      duration,
    });
  } catch (error) {
    console.error('[GEOCODE ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
} 