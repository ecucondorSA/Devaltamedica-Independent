"use client";

import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el componente se ha hidratado en el cliente
 * Soluciona problemas de SSR/hydration en desarrollo
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}