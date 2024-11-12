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

// Cache duration in milliseconds (30 seconds instead of 5 minutes)
const CACHE_DURATION = 30 * 1000;

export function useWingSpots(endpoint: string) {
  const [spots, setSpots] = useState<WingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);

  const fetchSpots = useCallback(async () => {
    const now = Date.now();
    // Don't fetch if the cache is still valid
    if (lastFetched && now - lastFetched < CACHE_DURATION) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSpots(data.data);
      setLastFetched(now);
    } catch (err) {
      setError('Failed to load wing spots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, lastFetched]);

  // Initial fetch
  useEffect(() => {
    if (!lastFetched) {
      fetchSpots();
    }
  }, [fetchSpots, lastFetched]);

  // Set up periodic refresh
  useEffect(() => {
    const intervalId = setInterval(fetchSpots, CACHE_DURATION);

    // Refresh on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSpots();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSpots]);

  return {
    spots,
    loading,
    error
  };
} 
