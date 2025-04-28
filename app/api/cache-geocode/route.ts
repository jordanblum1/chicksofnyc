import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import logger from '../../utils/logger';

const CACHE_PREFIX = 'geo_';
const CACHE_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

// Helper to format time duration
function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

// Helper to check if KV is available
function isKvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Helper to log batches of addresses for cache statistics
function logAddressBatch(addresses: string[], status: 'hit' | 'miss', ages?: number[]) {
  if (status === 'hit' && ages) {
    const formattedAges = ages.map(age => formatDuration(age));
    logger.info('GEOCODE', `✓ Cache hit for ${addresses.length} address(es), ages: ${formattedAges.join(', ')}`);
  } else {
    logger.info('GEOCODE', `✗ Cache miss for ${addresses.length} address(es)`);
  }
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

    // If KV is not available, just return success without caching
    if (!isKvAvailable()) {
      logger.warn('GEOCODE', `⚠ KV not available, skipping cache for: "${address}"`);
      return NextResponse.json({
        success: true,
        coordinates,
      });
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

    logger.info('GEOCODE', `→ Cached coordinates for address: "${address}"`);

    return NextResponse.json({
      success: true,
      coordinates,
    });
  } catch (error) {
    logger.error('GEOCODE', `✗ Cache error:`, error);
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

    // If KV is not available, return cache miss to force direct geocoding
    if (!isKvAvailable()) {
      logger.warn('GEOCODE', `⚠ KV not available, returning cache miss for: "${address}"`);
      return NextResponse.json({ fromCache: false });
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
    logger.error('GEOCODE', `✗ Cache error:`, error);
    return NextResponse.json(
      { error: 'Failed to get cached coordinates' },
      { status: 500 }
    );
  }
} 
