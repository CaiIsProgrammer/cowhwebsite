import { useCallback, useEffect, useState } from 'react';

// Shared fetch/loading/error/refetch plumbing for pages backed by a sheet.
export default function useSheetData(fetcher) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(() => {
    setLoading(true);
    setError('');
    return fetcher()
      .then((rows) => setData(rows))
      .catch((err) => setError(err.message || 'Failed to load data from the Sheet.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
