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
      const response = await fetch(endpoint, {
        cache: 'no-store',
        next: { revalidate: 0 }
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

  // Fetch on mount
  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    const intervalId = setInterval(fetchSpots, 30000);

    // Refresh on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSpots();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSpots]);

  return { spots, loading, error, refetch: fetchSpots };
} 
