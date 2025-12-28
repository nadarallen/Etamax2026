'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth(requireAuth = false) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Failed to fetch user', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    useEffect(() => {
        if (requireAuth && !loading && !user) {
            router.push('/login');
        }
    }, [user, loading, requireAuth, router]);

    return { user, loading };
}
