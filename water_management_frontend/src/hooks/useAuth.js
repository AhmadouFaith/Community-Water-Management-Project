import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth — convenience hook to access auth context.
 * Returns { user, loading, login, logout }
 */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
