import { useAuth } from '@altamedica/auth/client';
import { useEffect } from 'react';

// Hook específico para admin que redirige a web-app
export function useRequireAuth(redirectTo = '/') {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = process.env.NEXT_PUBLIC_WEB_APP_URL + redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
}
