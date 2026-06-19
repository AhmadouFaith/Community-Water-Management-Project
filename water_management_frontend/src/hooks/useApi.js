import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * useApi — generic data-fetching hook.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(someAPI.getAll);
 *   useEffect(() => { execute(); }, []);
 *
 * @param {Function} apiFn  — async API function that returns an axios response
 * @param {*}        initial — initial value for `data` (default: null)
 */
export function useApi(apiFn, initial = null) {
    const [data, setData] = useState(initial);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFn(...args);
            setData(res.data);
            return res.data;
        } catch (err) {
            const msg = err?.response?.data?.error || err.message || 'Request failed';
            setError(msg);
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFn]);

    return { data, loading, error, execute };
}
