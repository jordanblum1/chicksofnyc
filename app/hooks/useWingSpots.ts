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
}

export function useWingSpots<T extends WingSpot>(endpoint: string) {
  const [spots, setSpots] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSpots() {
      try {
        const response = await fetch(endpoint);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch spots');
        }

        const spotsWithMaps = await Promise.all(
          result.data.map(async (spot: T) => {
            try {
              console.log(`Preloading map for ${spot.name}...`);
              const mapResponse = await fetch(
                `/api/cache-map-url?name=${encodeURIComponent(spot.name)}&address=${encodeURIComponent(spot.address)}`
              );
              const mapData = await mapResponse.json();
              console.log(`Map for ${spot.name} ${mapData.fromCache ? 'loaded from cache' : 'newly generated'}`);
              return { ...spot, mapUrl: mapData.url };
            } catch (err) {
              console.error(`Failed to preload map for ${spot.name}:`, err);
              return spot;
            }
          })
        );

        if (isMounted) {
          setSpots(spotsWithMaps);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
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
