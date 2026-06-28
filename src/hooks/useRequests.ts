import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useRequests(filters?: { city?: string, bloodType?: string, status?: string, mine?: boolean, acceptedByMe?: boolean }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await api.get('/requests', { params: filters });
        setRequests(res.data.requests || []);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters ? JSON.stringify(filters) : filters]);

  return { requests, loading, error };
}
