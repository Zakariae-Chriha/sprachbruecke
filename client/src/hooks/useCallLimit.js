import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export function useCallLimit() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const fetchStatus = async () => {
    if (!user) return;
    try {
      const r = await api.get('/api/stripe/status');
      setStatus(r.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => { fetchStatus(); }, [user]);

  // Call this after a 402 response
  const handleLimitReached = (errorData) => {
    setStatus(s => ({
      ...s,
      callsThisMonth: errorData?.used ?? s?.callsThisMonth,
      freeCallsLimit: errorData?.limit ?? s?.freeCallsLimit,
      resetDate: errorData?.resetDate ?? s?.resetDate,
    }));
    setShowUpgrade(true);
  };

  return { status, showUpgrade, setShowUpgrade, handleLimitReached, refetch: fetchStatus };
}
