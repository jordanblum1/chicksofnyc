import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const CACHE_PREFIX = 'photos_';
const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

interface PlacePhoto {
  photo_reference: string;
}

// Use the server-side API key for Places API
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// 24 hours in seconds for HTTP cache
const CACHE_MAX_AGE = 60 * 60 * 24;

// Configure route for dynamic usage
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Helper to check if KV is available
function isKvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getPlaceId(query: string) {
  console.log('[PLACES API] Searching for place:', query);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      query
    )}&inputtype=textquery&fields=place_id,name,formatted_address&key=${PLACES_API_KEY}`
  );
  const data = await response.json();
  console.log('[PLACES API] Search response:', JSON.stringify(data));
  return data.candidates[0]?.place_id;
}

async function findPlaceWithPhotos(name: string, address: string) {
  // First try with name and address
  let query = `${name} ${address}`;
  let placeId = await getPlaceId(query);
  let photos: any[] = [];
  let placeInfo = { name: "", address: "", query: query };
  
  if (placeId) {
    const details = await getPlaceDetails(placeId);
    photos = details.photos || [];
    placeInfo = { 
      name: details.name || name, 
      address: details.formatted_address || address,
      query: query 
    };
  }
  
  // If no photos, try without leading space
  if ((!placeId || photos.length === 0) && name.startsWith(' ')) {
    console.log('[PLACES API] No photos found, trying without leading space');
    const trimmedName = name.trim();
    query = `${trimmedName} ${address}`;
    placeId = await getPlaceId(query);
    
    if (placeId) {
      const details = await getPlaceDetails(placeId);
      photos = details.photos || [];
      if (photos.length > 0) {
        placeInfo = { 
          name: details.name || trimmedName, 
          address: details.formatted_address || address,
          query: query 
        };
      }
    }
  }
  
  // If still no photos, try with more specific search
  if (!placeId || photos.length === 0) {
    console.log('[PLACES API] Still no photos, trying with wings keyword');
    query = `${name.trim()} wings ${address.split(',')[0]}`;
    placeId = await getPlaceId(query);
    
    if (placeId) {
      const details = await getPlaceDetails(placeId);
      photos = details.photos || [];
      if (photos.length > 0) {
        placeInfo = { 
          name: details.name || name.trim(), 
          address: details.formatted_address || address,
          query: query 
        };
      }
    }
  }
  
  // Last resort: try text search
  if (!placeId || photos.length === 0) {
    console.log('[PLACES API] Still no photos, trying text search');
    // Extract city
    const addressParts = address.split(',');
    const city = addressParts.length > 1 ? addressParts[1].trim() : 'New York';
    
    const textSearchQuery = `${name.trim()} bar ${city}`;
    console.log('[PLACES API] Text search query:', textSearchQuery);
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          textSearchQuery
        )}&key=${PLACES_API_KEY}`
      );
      const data = await response.json();
      console.log('[PLACES API] Text search response:', JSON.stringify(data));
      
      if (data.status === 'OK' && data.results?.length) {
        placeId = data.results[0].place_id;
        const details = await getPlaceDetails(placeId);
        photos = details.photos || [];
        if (photos.length > 0) {
          placeInfo = { 
            name: details.name || name.trim(), 
            address: details.formatted_address || address,
            query: textSearchQuery 
          };
        }
      }
    } catch (error) {
      console.error('[PLACES API] Error in text search:', error);
    }
  }
  
  // Final attempt: try with a different format
  if (!placeId || photos.length === 0) {
    const finalQuery = `restaurant ${name.trim()} ${address.split(',')[0]}`;
    console.log('[PLACES API] Final attempt with query:', finalQuery);
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          finalQuery
        )}&key=${PLACES_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.length) {
        placeId = data.results[0].place_id;
        const details = await getPlaceDetails(placeId);
        photos = details.photos || [];
        if (photos.length > 0) {
          placeInfo = { 
            name: details.name || name.trim(), 
            address: details.formatted_address || address,
            query: finalQuery 
          };
        }
      }
    } catch (error) {
      console.error('[PLACES API] Error in final search attempt:', error);
    }
  }
  
  return { placeId, photos, placeInfo };
}

async function getPlaceDetails(placeId: string) {
  console.log('[PLACES API] Fetching details for place ID:', placeId);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,photos&key=${PLACES_API_KEY}`
  );
  const data = await response.json();
  console.log('[PLACES API] Details response:', JSON.stringify(data));
  return {
    photos: data.result?.photos || [],
    name: data.result?.name,
    formatted_address: data.result?.formatted_address
  };
}

async function getPhotoUrl(photoReference: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photo_reference=${photoReference}&key=${PLACES_API_KEY}`,
      { redirect: 'manual' }
    );
    const location = response.headers.get('location');
    console.log('[PHOTOS API] Photo redirect URL:', location ? location.substring(0, 50) + '...' : 'null');
    return location;
  } catch (error) {
    console.error('[PHOTOS API] Error fetching photo:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const startTime = performance.now();
    const name = request.nextUrl.searchParams.get('name')?.trim();
    const address = request.nextUrl.searchParams.get('address')?.trim();
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    console.log(`[PHOTOS] Processing request for: "${name}" at "${address}" ${forceRefresh ? '(REFRESH FORCED)' : ''}`);

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      );
    }

    const cacheKey = `${CACHE_PREFIX}${name}-${address}`.toLowerCase();
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    // Check Redis cache if available and not forcing refresh
    let cachedEntry = null;
    if (isKvAvailable() && !forceRefresh) {
      cachedEntry = await kv.get(cacheKey);
      
      // Detect expired photo references (older than 24 hours)
      if (cachedEntry) {
        const cacheAge = now - (cachedEntry as any).timestamp;
        if (cacheAge > CACHE_DURATION) {
          console.log(`[PHOTOS] Cache expired (${Math.round(cacheAge/3600)} hours old), forcing refresh`);
          cachedEntry = null;
        }
      }
    } else if (forceRefresh) {
      console.log(`[PHOTOS] ⚠ Cache refresh forced for: "${name}"`);
    } else {
      console.log(`[PHOTOS] ⚠ KV not available, skipping cache for: "${name}"`);
    }

    if (cachedEntry) {
      const duration = Math.round(performance.now() - startTime);
      const cacheAge = (now - (cachedEntry as any).timestamp) * 1000; // Convert to milliseconds
      const cacheHours = Math.round(cacheAge / (1000 * 60 * 60));
      console.log(`[PHOTOS CACHE HIT] "${name}" - Duration: ${duration}ms`);
      console.log(`[PHOTOS CACHE AGE] ${cacheHours} hours old`);
      console.log(`[PHOTOS COUNT] ${(cachedEntry as any).photos.length} photos`);
      
      return NextResponse.json({ 
        photos: (cachedEntry as any).photos,
        placeInfo: (cachedEntry as any).placeInfo || { name, address },
        fromCache: true,
        cacheAge,
        duration 
      });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('[PHOTOS ERROR] Missing API key');
      throw new Error('Missing API key');
    }

    console.log(`[PHOTOS API CALL] Fetching fresh photos for: "${name}"`);
    
    // Use the enhanced place search function
    const { placeId, photos, placeInfo } = await findPlaceWithPhotos(name, address);

    if (!placeId) {
      console.error(`[PHOTOS ERROR] Place not found for: "${name}"`);
      return NextResponse.json(
        { 
          error: 'Place not found', 
          photos: [],
          placeInfo: { name, address, query: `${name} ${address}` }
        },
        { status: 200 } // Return 200 instead of 404 to prevent UI errors
      );
    }

    console.log(`[PHOTOS API] Found ${photos.length} photos for: "${name}" (place: "${placeInfo.name}")`);

    const photoUrls = await Promise.all(
      photos
        .slice(0, 6)
        .map((photo: PlacePhoto) => getPhotoUrl(photo.photo_reference))
    ).then(urls => urls.filter((url): url is string => url !== null));

    console.log(`[PHOTOS API] Generated ${photoUrls.length} photo URLs for: "${name}"`);

    // Cache in Redis with expiration if available
    if (isKvAvailable()) {
      await kv.set(cacheKey, {
        photos: photoUrls,
        placeInfo,
        timestamp: now
      }, {
        ex: CACHE_DURATION // Set expiration in seconds
      });
    }

    const duration = Math.round(performance.now() - startTime);
    console.log(`[PHOTOS COMPLETE] Duration: ${duration}ms`);

    return NextResponse.json({ 
      photos: photoUrls,
      placeInfo,
      fromCache: false,
      duration 
    });
  } catch (error) {
    console.error('[PHOTOS ERROR] Failed to fetch photos:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch photos',
        details: error instanceof Error ? error.message : 'Unknown error',
        photos: [] // Return empty array to prevent UI errors
      },
      { status: 200 } // Return 200 instead of 500 to prevent UI errors
    );
  }
} 

