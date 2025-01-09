import { NextRequest, NextResponse } from 'next/server';

interface CacheEntry {
  url: string;
  timestamp: number;
}

const MAP_CACHE: { [key: string]: CacheEntry } = {};
const CACHE_DURATION = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get('name')?.trim();
  const address = searchParams.get('address')?.trim();
  const isDeployment = process.env.VERCEL_ENV !== undefined;

  if (!name || !address) {
    return NextResponse.json(
      { error: 'Name and address are required' },
      { status: 400 }
    );
  }

  const cacheKey = `${name}|${address}`;
  const cachedEntry = MAP_CACHE[cacheKey];
  const now = Date.now();

  // Check if we have a valid cached entry
  if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
    const duration = Math.round(performance.now() - startTime);
    return NextResponse.json({
      url: cachedEntry.url,
      fromCache: true,
      duration,
    });
  }

  // Only generate new cache entries during deployment or if cache is expired
  if (!isDeployment && cachedEntry) {
    // Return the expired cache entry but mark it as stale
    const duration = Math.round(performance.now() - startTime);
    return NextResponse.json({
      url: cachedEntry.url,
      fromCache: true,
      isStale: true,
      duration,
    });
  }

  // Generate the map URL
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(name + ' ' + address)}`;

  // Cache the result
  MAP_CACHE[cacheKey] = {
    url: mapUrl,
    timestamp: now,
  };

  const duration = Math.round(performance.now() - startTime);
  return NextResponse.json({
    url: mapUrl,
    fromCache: false,
    duration,
  });
} 