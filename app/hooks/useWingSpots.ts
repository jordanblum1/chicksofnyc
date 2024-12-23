import { useState, useEffect, useCallback } from 'react';

interface WingSpot {
  id: string;
  name: string;
  address: string;
  overallRanking: number;
  sauce: number;
  crispyness: number;
  meat: number;
}

export function useWingSpots(endpoint: string) {
  const [spots, setSpots] = useState<WingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${endpoint}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSpots(data.data);
    } catch (err) {
      setError('Failed to load wing spots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Fetch only on mount
  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  return { spots, loading, error, refetch: fetchSpots };
} 
