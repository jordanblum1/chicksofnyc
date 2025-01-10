import { useState, useEffect } from 'react';

interface WingSpot {
  id: string;
  name: string;
  address: string;
  overallRanking?: number;
  sauce?: number;
  crispyness?: number;
  meat?: number;
  instagram?: string;
  mapUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export function useWingSpots<T extends WingSpot>(endpoint: string) {
  const [spots, setSpots] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSpots() {
      try {
        console.log('[SPOTS] Fetching spots from:', endpoint);
        const response = await fetch(endpoint);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch spots');
        }

        console.log(`[SPOTS] Found ${result.data.length} spots to process`);
        const spotsWithData = await Promise.all(
          result.data.map(async (spot: T) => {
            try {
              // First, get geocoding data
              console.log(`\n[SPOT: ${spot.name}] Starting data fetch...`);
              console.log(`[GEOCODING] Fetching for address: "${spot.address}"`);
              
              const geocodeResponse = await fetch(
                `/api/geocode-location?address=${encodeURIComponent(spot.address)}`
              );
              const geocodeData = await geocodeResponse.json();
              
              if (geocodeData.error) {
                console.error(`[GEOCODING ERROR] ${spot.name}: ${geocodeData.error}`);
              } else {
                const status = geocodeData.fromCache ? 
                  (geocodeData.isStale ? 'STALE CACHE' : 'CACHE HIT') : 
                  'FRESH DATA';
                const age = geocodeData.cacheAge ? 
                  ` (${Math.round(geocodeData.cacheAge / (1000 * 60 * 60))} hours old)` : 
                  '';
                console.log(`[GEOCODING ${status}] ${spot.name}${age}`);
                console.log(`[GEOCODING COORDS] ${JSON.stringify(geocodeData.coordinates)}`);
              }

              // Then, get map URL using the cached geocode
              console.log(`[MAP] Fetching for: ${spot.name}`);
              const mapResponse = await fetch(
                `/api/cache-map-url?name=${encodeURIComponent(spot.name)}&address=${encodeURIComponent(spot.address)}`
              );
              const mapData = await mapResponse.json();
              const mapStatus = mapData.fromCache ? 
                (mapData.isStale ? 'STALE CACHE' : 'CACHE HIT') : 
                'FRESH DATA';
              console.log(`[MAP ${mapStatus}] ${spot.name}`);

              return { 
                ...spot, 
                mapUrl: mapData.url,
                coordinates: geocodeData.coordinates
              };
            } catch (err) {
              console.error(`[ERROR] Failed to fetch data for ${spot.name}:`, err);
              return spot;
            }
          })
        );

        if (isMounted) {
          console.log('[SPOTS] All spot data processed successfully');
          setSpots(spotsWithData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[ERROR] Failed to fetch spots:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
          setLoading(false);
        }
      }
    }

    fetchSpots();

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  return { spots, loading, error };
} 
