import { NextResponse } from 'next/server';

// This endpoint will only be called during build/deployment time
export async function GET() {
  // Only run during Vercel deployment
  if (!process.env.VERCEL_ENV) {
    return NextResponse.json({ error: 'This endpoint is only available during Vercel deployment' }, { status: 403 });
  }

  try {
    // Fetch all wing spots to prime the cache
    const wingsResponse = await fetch(`${process.env.VERCEL_URL}/api/get-all-wings`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const wingsData = await wingsResponse.json();

    // Prime the cache for each spot's photos and map
    const spots = wingsData.data;
    for (const spot of spots) {
      // Prime photos cache
      await fetch(`${process.env.VERCEL_URL}/api/get-place-photos?name=${encodeURIComponent(spot.name)}&address=${encodeURIComponent(spot.address)}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      // Prime map cache
      await fetch(`${process.env.VERCEL_URL}/api/cache-map-url?name=${encodeURIComponent(spot.name)}&address=${encodeURIComponent(spot.address)}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cache initialized successfully',
      spotsProcessed: spots.length
    });
  } catch (error) {
    console.error('Error initializing cache:', error);
    return NextResponse.json({ error: 'Failed to initialize cache' }, { status: 500 });
  }
} 