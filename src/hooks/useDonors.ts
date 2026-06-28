import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useDonors(city?: string, bloodType?: string) {
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (city && city !== 'all') params.city = city;
        if (bloodType && bloodType !== 'all') params.bloodType = bloodType;
        
        const res = await api.get('/donors', { params });
        setDonors(res.data.donors || []);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch donors');
      } finally {
        setLoading(false);
      }
    };

    fetchDonors();
  }, [city, bloodType]);

  return { donors, loading, error, refetch: () => setDonors([]) };
}
