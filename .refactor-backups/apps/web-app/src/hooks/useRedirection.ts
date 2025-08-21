import { useAuth  } from '@altamedica/auth';;
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RedirectService } from '../services/redirect-service';

interface UseRedirectionOptions {
  checkInterval?: number; // Intervalo para verificar redirección (ms)
  showLoader?: boolean; // Mostrar loader durante redirección
}

interface UseRedirectionReturn {
  isRedirecting: boolean;
  redirectTarget: string | null;
  performRedirection: (url?: string) => void;
  cancelRedirection: () => void;
}

/**
 * Hook para manejar redirecciones con estado y UI feedback
 */
export function useRedirection(options: UseRedirectionOptions = {}): UseRedirectionReturn {
  const { checkInterval = 1000, showLoader = true } = options;
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const router = useRouter();

  // Verificar si se necesita redirección basada en el rol
  useEffect(() => {
    if (!userProfile) return;

    const currentPath = window.location.pathname;
    const shouldRedirect = RedirectService.shouldRedirectToOtherApp(userProfile.role, currentPath);

    if (shouldRedirect) {
      const targetUrl = RedirectService.getAppUrl(userProfile.role);
      setRedirectTarget(targetUrl);
    }
  }, [userProfile]);

  // Función para ejecutar redirección
  const performRedirection = (url?: string) => {
    const targetUrl = url || redirectTarget;
    if (!targetUrl) return;

    setIsRedirecting(true);

    // Usar el servicio de redirección con opciones
    RedirectService.performRedirect(targetUrl, router, {
      showLoader,
      loaderMessage: `Preparando tu experiencia personalizada...`,
    });
  };

  // Función para cancelar redirección
  const cancelRedirection = () => {
    setIsRedirecting(false);
    setRedirectTarget(null);
  };

  return {
    isRedirecting,
    redirectTarget,
    performRedirection,
    cancelRedirection,
  };
}
