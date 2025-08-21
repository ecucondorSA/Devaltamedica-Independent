import { useEffect } from 'react';
import type { Map } from 'leaflet';

/**
 * Hook to handle map size invalidation
 * Listens for the global 'map:invalidate-size' event
 */
export function useInvalidateMapSize(map: Map | null) {
  useEffect(() => {
    if (!map) return;

    const handleInvalidateSize = () => {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    // Initial invalidation after mount
    handleInvalidateSize();

    // Listen for global event
    window.addEventListener('map:invalidate-size', handleInvalidateSize);

    // Also invalidate on window resize
    window.addEventListener('resize', handleInvalidateSize);

    return () => {
      window.removeEventListener('map:invalidate-size', handleInvalidateSize);
      window.removeEventListener('resize', handleInvalidateSize);
    };
  }, [map]);
}

/**
 * Utility to trigger map size invalidation globally
 */
export function triggerMapInvalidateSize() {
  window.dispatchEvent(new Event('map:invalidate-size'));
}