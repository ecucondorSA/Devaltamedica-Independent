import { useAuth  } from '@altamedica/auth';;
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface UseProtectedRouteOptions {
  requireAuth?: boolean;
  requireRole?: 'patient' | 'doctor' | 'company' | 'admin';
  redirectTo?: string;
}

export const useProtectedRoute = ({
  requireAuth = true,
  requireRole,
  redirectTo = '/auth/login',
}: UseProtectedRouteOptions = {}) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.push(redirectTo);
      return;
    }

    if (requireRole && userProfile && userProfile.role !== requireRole) {
      router.push('/unauthorized');
    }
  }, [user, userProfile, loading, requireAuth, requireRole, router, pathname, redirectTo]);

  return { user, userProfile, loading, isAuthorized: !!user };
};
