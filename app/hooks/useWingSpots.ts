import { useState, useEffect } from 'react';

interface ApiResponse<T> {
  success: boolean;
  data: T[];
  error?: string;
}

export function useWingSpots<T>(endpoint: string) {
  const [spots, setSpots] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpots() {
      try {
        const response = await fetch(endpoint);
        const data: ApiResponse<T> = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch spots');
        }

        setSpots(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchSpots();
  }, [endpoint]);

  return { spots, loading, error };
} 
