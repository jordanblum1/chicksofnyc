import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const CACHE_PREFIX = 'geo_';
const CACHE_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export async function POST(request: Request) {
  try {
    const { address, coordinates } = await request.json();

    if (!address || !coordinates) {
      return NextResponse.json(
        { error: 'Address and coordinates are required' },
        { status: 400 }
      );
    }

    const cacheKey = `${CACHE_PREFIX}${address.toLowerCase()}`;
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    // Store in Redis with expiration
    await kv.set(cacheKey, {
      coordinates,
      timestamp: now,
    }, {
      ex: CACHE_DURATION
    });

    console.log(`[GEOCODE] → Cached coordinates for address: "${address}"`);

    return NextResponse.json({
      success: true,
      coordinates,
    });
  } catch (error) {
    console.error('[GEOCODE] ✗ Cache error:', error);
    return NextResponse.json(
      { error: 'Failed to cache coordinates' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address')?.trim();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const cacheKey = `${CACHE_PREFIX}${address.toLowerCase()}`;
    const cachedEntry = await kv.get(cacheKey);

    if (cachedEntry) {
      console.log(`[GEOCODE] ✓ Cache hit for address: "${address}"`);
      return NextResponse.json({
        coordinates: (cachedEntry as any).coordinates,
        fromCache: true,
      });
    }

    console.log(`[GEOCODE] ✗ Cache miss for address: "${address}"`);
    return NextResponse.json({ fromCache: false });
  } catch (error) {
    console.error('[GEOCODE] ✗ Cache error:', error);
    return NextResponse.json(
      { error: 'Failed to get cached coordinates' },
      { status: 500 }
    );
  }
} 