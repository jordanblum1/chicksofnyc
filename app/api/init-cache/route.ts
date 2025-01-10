import { NextResponse } from 'next/server';

// This endpoint will only be called during build/deployment time
export async function GET() {
  // Only run during Vercel deployment
  if (!process.env.VERCEL_ENV) {
    return NextResponse.json({ error: 'This endpoint is only available during Vercel deployment' }, { status: 403 });
  }

  try {
    // Construct the base URL properly
    const baseUrl = process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}` : 
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    console.log('[CACHE INIT] Using base URL:', baseUrl);

    // Fetch all wing spots to prime the cache
    const wingsResponse = await fetch(`${baseUrl}/api/get-all-wings`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!wingsResponse.ok) {
      throw new Error(`Failed to fetch wings: ${wingsResponse.status} ${wingsResponse.statusText}`);
    }

    const wingsData = await wingsResponse.json();
    console.log(`[CACHE INIT] Found ${wingsData.data.length} spots to process`);

    // Prime the cache for each spot's photos and map
    const spots = wingsData.data;
    for (const spot of spots) {
      try {
        console.log(`[CACHE INIT] Processing spot: ${spot.name}`);
        
        // Prime photos cache
        const photosResponse = await fetch(
          `${baseUrl}/api/get-place-photos?name=${encodeURIComponent(spot.name)}&address=${encodeURIComponent(spot.address)}`,
          {
            headers: {
              'Cache-Control': 'no-cache'
            }
          }
        );
        if (!photosResponse.ok) {
          console.error(`[CACHE INIT] Failed to cache photos for ${spot.name}: ${photosResponse.status}`);
        }

        // Prime map cache
        const mapResponse = await fetch(
          `${baseUrl}/api/cache-map-url?name=${encodeURIComponent(spot.name)}&address=${encodeURIComponent(spot.address)}`,
          {
            headers: {
              'Cache-Control': 'no-cache'
            }
          }
        );
        if (!mapResponse.ok) {
          console.error(`[CACHE INIT] Failed to cache map for ${spot.name}: ${mapResponse.status}`);
        }
      } catch (spotError) {
        console.error(`[CACHE INIT] Error processing spot ${spot.name}:`, spotError);
        // Continue with next spot even if one fails
        continue;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cache initialized successfully',
      spotsProcessed: spots.length,
      baseUrl
    });
  } catch (error) {
    console.error('[CACHE INIT] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize cache', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 