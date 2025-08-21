"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngTuple } from "leaflet";

// Tipos para el mapa del dashboard
interface MapLocation {
  id: string;
  name: string;
  type: 'company' | 'hospital' | 'clinic' | 'office';
  location: string;
  coordinates: LatLngTuple;
  employees?: number;
  doctors?: number;
  rating?: number;
  status: 'active' | 'inactive' | 'pending';
}

interface AltamedicaInteractiveMapProps {
  locations?: MapLocation[];
  center?: LatLngTuple;
  zoom?: number;
}

// Datos simulados para el dashboard
const mockLocations: MapLocation[] = [
  {
    id: "1",
    name: "Hospital Italiano de Buenos Aires",
    type: "hospital",
    location: "Buenos Aires, Argentina",
    coordinates: [-34.6037, -58.3816],
    employees: 2500,
    doctors: 450,
    rating: 4.9,
    status: "active"
  },
  {
    id: "2",
    name: "Clínica Altamedica Córdoba",
    type: "clinic",
    location: "Córdoba, Argentina",
    coordinates: [-31.4201, -64.1888],
    employees: 180,
    doctors: 25,
    rating: 4.7,
    status: "active"
  },
  {
    id: "3",
    name: "Centro Médico Rosario",
    type: "office",
    location: "Rosario, Argentina",
    coordinates: [-32.9468, -60.6393],
    employees: 85,
    doctors: 12,
    rating: 4.5,
    status: "active"
  },
  {
    id: "4",
    name: "Hospital Metropolitano Quito",
    type: "hospital",
    location: "Quito, Ecuador",
    coordinates: [-0.2299, -78.5249],
    employees: 1800,
    doctors: 320,
    rating: 4.8,
    status: "active"
  },
  {
    id: "5",
    name: "Clínica Porto Alegre",
    type: "clinic",
    location: "Porto Alegre, Brasil",
    coordinates: [-30.0346, -51.2177],
    employees: 220,
    doctors: 35,
    rating: 4.6,
    status: "pending"
  }
];

// Configurar iconos personalizados según el tipo
const createCustomIcon = (type: string, status: string) => {
  const colors = {
    hospital: status === 'active' ? '#dc2626' : '#9ca3af',
    clinic: status === 'active' ? '#2563eb' : '#9ca3af',
    office: status === 'active' ? '#059669' : '#9ca3af',
    company: status === 'active' ? '#7c3aed' : '#9ca3af'
  };

  const icons = {
    hospital: "🏥",
    clinic: "🏥",
    office: "🏢",
    company: "🏢"
  };

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="marker-container">
        <div class="marker-icon ${status}" style="background: ${colors[type as keyof typeof colors]}">
          <span style="font-size: 16px;">${icons[type as keyof typeof icons]}</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function AltamedicaInteractiveMap({ 
  locations = mockLocations, 
  center = [-34.6037, -58.3816], 
  zoom = 5 
}: AltamedicaInteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Configurar Leaflet para SSR
    if (typeof window !== "undefined") {
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
      <div className="h-full bg-gradient-to-br from-blue-50 to-sky-100 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-sm font-medium text-gray-700">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease;
          border: 3px solid white;
        }
        
        .marker-icon:hover {
          transform: scale(1.1);
        }
        
        .marker-icon.active {
          animation: pulse 2s infinite;
        }
        
        .marker-icon.pending {
          opacity: 0.7;
        }
        
        .marker-icon.inactive {
          opacity: 0.5;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
          50% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); }
          100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        }
        
        .leaflet-popup-content {
          margin: 12px 16px;
          font-family: var(--font-inter), system-ui, sans-serif;
          min-width: 200px;
        }
        
        .leaflet-popup-content h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #1f2937;
        }
        
        .leaflet-popup-content p {
          font-size: 14px;
          margin: 4px 0;
          color: #6b7280;
        }
        
        .leaflet-popup-content .stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }
        
        .leaflet-popup-content .stat {
          text-align: center;
        }
        
        .leaflet-popup-content .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .leaflet-popup-content .stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .leaflet-popup-content .status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          margin-top: 8px;
          text-transform: capitalize;
        }
        
        .leaflet-popup-content .status.active {
          background: #dcfce7;
          color: #166534;
        }
        
        .leaflet-popup-content .status.pending {
          background: #fef3c7;
          color: #92400e;
        }
        
        .leaflet-popup-content .status.inactive {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full rounded-lg"
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
        
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={location.coordinates}
            icon={createCustomIcon(location.type, location.status)}
          >
            <Popup>
              <div className="location-popup">
                <h3>{location.name}</h3>
                <p><strong>Tipo:</strong> {location.type}</p>
                <p><strong>Ubicación:</strong> {location.location}</p>
                {location.rating && (
                  <p><strong>Calificación:</strong> ⭐ {location.rating}/5.0</p>
                )}
                
                <div className="stats">
                  {location.employees && (
                    <div className="stat">
                      <div className="stat-value">{location.employees.toLocaleString()}</div>
                      <div className="stat-label">Empleados</div>
                    </div>
                  )}
                  {location.doctors && (
                    <div className="stat">
                      <div className="stat-value">{location.doctors}</div>
                      <div className="stat-label">Médicos</div>
                    </div>
                  )}
                </div>
                
                <span className={`status ${location.status}`}>
                  {location.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 