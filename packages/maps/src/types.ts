import type { MapContainerProps } from 'react-leaflet';

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface SSRSafeMapProps extends MapContainerProps {
  center: MapPosition | [number, number];
  zoom?: number;
  children?: React.ReactNode;
  onMapReady?: (map: L.Map) => void;
  className?: string;
  id?: string;
}