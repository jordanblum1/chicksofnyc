import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const CACHE_PREFIX = 'geo_';
const CACHE_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

// Helper to format time duration
function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

// Bundle multiple address logs
function logAddressBatch(addresses: string[], status: 'hit' | 'miss', cacheAges?: number[]) {
  const statusSymbol = status === 'hit' ? '✓' : '✗';
  const ageInfo = cacheAges ? ` (ages: ${cacheAges.map(age => formatDuration(age)).join(', ')})` : '';
  console.log(`[GEOCODE] ${statusSymbol} Cache ${status} for addresses: "${addresses.join('", "')}"${ageInfo}`);
}

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
    const now = Math.floor(Date.now() / 1000);

    if (cachedEntry) {
      const cacheAge = now - (cachedEntry as any).timestamp;
      logAddressBatch([address], 'hit', [cacheAge]);
      return NextResponse.json({
        coordinates: (cachedEntry as any).coordinates,
        fromCache: true,
        cacheAge,
      });
    }

    logAddressBatch([address], 'miss');
    return NextResponse.json({ fromCache: false });
  } catch (error) {
    console.error('[GEOCODE] ✗ Cache error:', error);
    return NextResponse.json(
      { error: 'Failed to get cached coordinates' },
      { status: 500 }
    );
  }
} 