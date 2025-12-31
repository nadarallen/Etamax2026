'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth(requireAuth: boolean = false) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch current user session from the JWT-based auth endpoint
    const getSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user ?? null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  // Redirect if auth is required and no user is found
  useEffect(() => {
    if (requireAuth && !loading && !user) {
      router.replace('/login');
    }
  }, [requireAuth, loading, user, router]);

  return { user, loading };
}
