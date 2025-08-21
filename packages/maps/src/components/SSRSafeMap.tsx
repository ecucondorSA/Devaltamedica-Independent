'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect } from 'react';
import type { Map } from 'leaflet';
import type { SSRSafeMapProps } from '../types';
import { fixLeafletIconPaths } from '../utils/leaflet-icons';
import { useInvalidateMapSize } from '../hooks/useInvalidateMapSize';

// Import MapContainer dynamically to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

/**
 * SSR-safe Leaflet map component for AltaMedica
 * Handles icon paths, invalidation, and SSR rendering
 */
export function SSRSafeMap({
  center,
  zoom = 13,
  children,
  onMapReady,
  className = 'h-full w-full',
  id,
  ...mapProps
}: SSRSafeMapProps) {
  const mapRef = useRef<Map | null>(null);

  // Fix icon paths on mount
  useEffect(() => {
    fixLeafletIconPaths();
  }, []);

  // Handle map instance
  const handleMapReady = (map: Map) => {
    mapRef.current = map;
    onMapReady?.(map);
  };

  // Use invalidation hook
  useInvalidateMapSize(mapRef.current);

  // Normalize center prop
  const normalizedCenter: [number, number] = Array.isArray(center)
    ? center
    : [center.lat, center.lng];

  return (
    <div className={className} id={id}>
      <MapContainer
        center={normalizedCenter}
        zoom={zoom}
        className="h-full w-full"
        ref={handleMapReady as any}
        {...mapProps}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </MapContainer>
    </div>
  );
}