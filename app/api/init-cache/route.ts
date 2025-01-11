import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const GEO_CACHE_PREFIX = 'geo_';
const MAP_CACHE_PREFIX = 'map_';
const PHOTOS_CACHE_PREFIX = 'photos_';

const GEO_CACHE_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds
const MAP_CACHE_DURATION = 10 * 24 * 60 * 60; // 10 days in seconds
const PHOTOS_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

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
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const results = [];

    for (const spot of spots) {
      try {
        console.log(`[CACHE INIT] Processing spot: ${spot.name}`);
        
        // Prime map cache
        const mapCacheKey = `${MAP_CACHE_PREFIX}${spot.name}|${spot.address}`.toLowerCase();
        const existingMap = await kv.get(mapCacheKey);
        
        if (!existingMap) {
          const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(spot.name + ' ' + spot.address)}`;
          await kv.set(mapCacheKey, {
            url: mapUrl,
            timestamp: now
          }, {
            ex: MAP_CACHE_DURATION
          });
          console.log(`[CACHE INIT] Cached map URL for: ${spot.name}`);
        }

        // Prime photos cache
        const photosCacheKey = `${PHOTOS_CACHE_PREFIX}${spot.name}-${spot.address}`.toLowerCase();
        const existingPhotos = await kv.get(photosCacheKey);
        
        if (!existingPhotos) {
          const query = `${spot.name} ${spot.address}`;
          const placeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${process.env.GOOGLE_PLACES_API_KEY}`
          );
          
          if (placeResponse.ok) {
            const placeData = await placeResponse.json();
            const placeId = placeData.candidates?.[0]?.place_id;
            
            if (placeId) {
              const detailsResponse = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${process.env.GOOGLE_PLACES_API_KEY}`
              );
              
              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json();
                const photos = detailsData.result?.photos || [];
                
                const photoUrls = await Promise.all(
                  photos
                    .slice(0, 6)
                    .map(async (photo: any) => {
                      const photoResponse = await fetch(
                        `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photo_reference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`,
                        { redirect: 'manual' }
                      );
                      return photoResponse.headers.get('location');
                    })
                ).then(urls => urls.filter((url): url is string => url !== null));

                if (photoUrls.length > 0) {
                  await kv.set(photosCacheKey, {
                    photos: photoUrls,
                    timestamp: now
                  }, {
                    ex: PHOTOS_CACHE_DURATION
                  });
                  console.log(`[CACHE INIT] Cached ${photoUrls.length} photos for: ${spot.name}`);
                }
              }
            }
          }
        }

        results.push({ name: spot.name, status: 'success' });
        
        // Add a small delay between spots to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (spotError) {
        console.error(`[CACHE INIT] Error processing spot ${spot.name}:`, spotError);
        results.push({ name: spot.name, status: 'error', error: spotError instanceof Error ? spotError.message : 'Unknown error' });
        continue;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cache initialized successfully',
      spotsProcessed: spots.length,
      results,
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