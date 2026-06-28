import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useMatch(bloodType: string, city?: string, maxDistance?: number) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findMatches = async (lat?: number, lng?: number) => {
    try {
      setLoading(true);
      const res = await api.get('/match', { 
        params: { bloodType, city, lat, lng, maxDistance } 
      });
      setMatches(res.data.donors || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  return { matches, loading, error, findMatches };
}
