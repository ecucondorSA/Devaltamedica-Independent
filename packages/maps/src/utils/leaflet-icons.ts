import L from 'leaflet';

/**
 * Fixes Leaflet's default icon paths for Next.js
 * Must be called before rendering any map
 */
export function fixLeafletIconPaths() {
  if (typeof window === 'undefined') return;

  // Fix default icon paths
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}

/**
 * Creates a custom marker icon with consistent sizing
 */
export function createMarkerIcon(options?: {
  iconUrl?: string;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
  popupAnchor?: [number, number];
}) {
  return L.icon({
    iconUrl: options?.iconUrl || '/leaflet/marker-icon.png',
    iconSize: options?.iconSize || [25, 41],
    iconAnchor: options?.iconAnchor || [12, 41],
    popupAnchor: options?.popupAnchor || [1, -34],
    shadowUrl: '/leaflet/marker-shadow.png',
    shadowSize: [41, 41],
  });
}