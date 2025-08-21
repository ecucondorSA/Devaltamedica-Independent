"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { LatLngTuple } from "leaflet";

// Tipos
interface Doctor {
  id: number;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  status: "Disponible" | "Ocupado";
  coordinates?: LatLngTuple;
}

interface InteractiveMapProps {
  doctors: Doctor[];
  center?: LatLngTuple;
}

// Configurar iconos de Leaflet (necesario para SSR)
const createCustomIcon = (status: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="marker-container">
        <div class="marker-icon ${status === 'Disponible' ? 'available' : 'busy'}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                  fill="${status === 'Disponible' ? '#10b981' : '#ef4444'}"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

export default function InteractiveMap({ doctors, center }: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Filtrar doctores con coordenadas
  const doctorsWithCoordinates = doctors.filter(doctor => doctor.coordinates);

  // Centro del mapa (Argentina) - fallback si no se proporciona center
  const mapCenter: LatLngTuple = center || [-34.6037, -58.3816]; // Buenos Aires

  useEffect(() => {
    // Asegurar que Leaflet se inicialice correctamente
    if (typeof window !== "undefined") {
      // Eliminar iconos por defecto de Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+",
        iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+",
        shadowUrl: "",
      });
    }
  }, []);

  if (typeof window === "undefined") {
    return (
      <div className="h-[600px] bg-gradient-to-br from-blue-50 to-sky-100 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-sm font-medium text-gray-700">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Estilos para los marcadores personalizados */}
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        .marker-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .marker-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease;
        }
        
        .marker-icon:hover {
          transform: scale(1.1);
        }
        
        .marker-icon.available {
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid #10b981;
        }
        
        .marker-icon.busy {
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid #ef4444;
        }
        
        .leaflet-popup-content {
          margin: 8px 12px;
          font-family: var(--font-inter), system-ui, sans-serif;
        }
        
        .leaflet-popup-content h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #1f2937;
        }
        
        .leaflet-popup-content p {
          font-size: 12px;
          margin: 2px 0;
          color: #6b7280;
        }
        
        .leaflet-popup-content .status {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          margin-top: 4px;
        }
        
        .leaflet-popup-content .status.available {
          background: #dcfce7;
          color: #166534;
        }
        
        .leaflet-popup-content .status.busy {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>

      <MapContainer
        center={mapCenter}
        zoom={5}
        className="h-[600px] w-full rounded-lg border border-gray-200"
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        boxZoom={true}
        keyboard={true}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {doctorsWithCoordinates.map((doctor) => (
          <Marker
            key={doctor.id}
            position={doctor.coordinates!}
            icon={createCustomIcon(doctor.status)}
          >
            <Popup>
              <div className="doctor-popup">
                <h3>{doctor.name}</h3>
                <p><strong>Especialidad:</strong> {doctor.specialty}</p>
                <p><strong>Ubicación:</strong> {doctor.location}</p>
                <p><strong>Calificación:</strong> ⭐ {doctor.rating}/5.0</p>
                <span className={`status ${doctor.status.toLowerCase()}`}>
                  {doctor.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 