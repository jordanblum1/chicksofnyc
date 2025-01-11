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
    const fetchSpots = async () => {
      try {
        setLoading(true);
        const response = await fetch(endpoint);
        const data = await response.json();
        
        console.log(`[SPOTS] Processing ${data.data.length} wing spots`);
        
        // Process each spot to add coordinates
        const spotsWithCoords = await Promise.all(data.data.map(async (spot: T) => {
          try {
            // Check Redis cache first
            const cacheResponse = await fetch(
              `/api/cache-geocode?address=${encodeURIComponent(spot.address)}`
            );
            const cacheData = await cacheResponse.json();
            
            if (cacheData.fromCache) {
              console.log(`[GEOCODE] ✓ Cache hit for "${spot.name}" (${spot.address})`);
              return {
                ...spot,
                coordinates: cacheData.coordinates
              };
            }
            
            console.log(`[GEOCODE] Cache miss for "${spot.name}" - using Google Maps API`);
            
            // If not in cache, use Google Maps Geocoder
            const geocoder = new google.maps.Geocoder();
            const results = await new Promise((resolve, reject) => {
              geocoder.geocode({ address: spot.address }, (results, status) => {
                if (status === 'OK' && results?.[0]?.geometry?.location) {
                  resolve(results);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              });
            });
            
            const position = (results as any)[0].geometry.location.toJSON();
            
            // Cache the result
            await fetch('/api/cache-geocode', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                address: spot.address,
                coordinates: position,
              }),
            });
            
            console.log(`[GEOCODE] → Cached new coordinates for "${spot.name}"`);
            
            return {
              ...spot,
              coordinates: position
            };
          } catch (error) {
            console.error(`[GEOCODE] ✗ Error processing "${spot.name}":`, error);
            return spot;
          }
        }));
        
        setSpots(spotsWithCoords);
      } catch (error) {
        console.error('[SPOTS] Error fetching spots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, [endpoint]);

  return { spots, loading, error };
} 
