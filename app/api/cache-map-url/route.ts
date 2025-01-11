import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const CACHE_PREFIX = 'map_';
const CACHE_DURATION = 10 * 24 * 60 * 60; // 10 days in seconds

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

  const cacheKey = `${CACHE_PREFIX}${name}|${address}`.toLowerCase();
  const now = Math.floor(Date.now() / 1000); // Current time in seconds

  // Check Redis cache first
  const cachedEntry = await kv.get(cacheKey);

  // Check if we have a valid cached entry
  if (cachedEntry) {
    const duration = Math.round(performance.now() - startTime);
    return NextResponse.json({
      url: (cachedEntry as any).url,
      fromCache: true,
      duration,
    });
  }

  // Only generate new cache entries during deployment or if cache is expired
  if (!isDeployment && cachedEntry) {
    // Return the expired cache entry but mark it as stale
    const duration = Math.round(performance.now() - startTime);
    return NextResponse.json({
      url: (cachedEntry as any).url,
      fromCache: true,
      isStale: true,
      duration,
    });
  }

  // Generate the map URL
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(name + ' ' + address)}`;

  // Cache the result in Redis with expiration
  await kv.set(cacheKey, {
    url: mapUrl,
    timestamp: now,
  }, {
    ex: CACHE_DURATION // Set expiration in seconds
  });

  const duration = Math.round(performance.now() - startTime);
  return NextResponse.json({
    url: mapUrl,
    fromCache: false,
    duration,
  });
} 