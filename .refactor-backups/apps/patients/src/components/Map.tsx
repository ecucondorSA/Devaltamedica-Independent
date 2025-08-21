'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Star } from 'lucide-react';

interface SpecialistLocation {
  id: string;
  name: string;
  specialty: string;
  distance: number;
  lat: number;
  lng: number;
  availability: 'available' | 'busy' | 'offline';
  rating: number;
  phone: string;
  address: string;
  canVideoCall: boolean;
  nextAvailable: Date;
  estimatedWaitTime: number;
}

interface MapProps {
  center: { lat: number; lng: number };
  specialists: SpecialistLocation[];
  onSelectSpecialist?: (specialist: SpecialistLocation) => void;
}

export default function Map({ center, specialists, onSelectSpecialist }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // En producción, aquí integrarías con Google Maps, Mapbox, etc.
    // Por ahora, simulamos un mapa interactivo con SVG
    if (!mapRef.current) return;

    // Limpiar marcadores anteriores
    markersRef.current = [];

    // Simular renderizado de mapa
    const renderMap = () => {
      if (!mapRef.current) return;

      // Crear un mapa SVG simple
      mapRef.current.innerHTML = `
        <div class="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
            <!-- Simular calles -->
            <g stroke="#e5e7eb" stroke-width="1" fill="none">
              <path d="M0,100 L400,100" />
              <path d="M0,200 L400,200" />
              <path d="M100,0 L100,300" />
              <path d="M200,0 L200,300" />
              <path d="M300,0 L300,300" />
            </g>
            
            <!-- Usuario actual -->
            <g transform="translate(200,150)">
              <circle r="8" fill="#3b82f6" />
              <circle r="12" fill="#3b82f6" fill-opacity="0.3" />
              <circle r="16" fill="#3b82f6" fill-opacity="0.2" />
            </g>
            
            <!-- Especialistas -->
            ${specialists.map((specialist, index) => {
              const x = 200 + (specialist.lng - center.lng) * 5000;
              const y = 150 + (specialist.lat - center.lat) * 5000;
              const color = specialist.availability === 'available' ? '#10b981' : 
                           specialist.availability === 'busy' ? '#f59e0b' : '#6b7280';
              
              return `
                <g transform="translate(${x},${y})" data-specialist-id="${specialist.id}" class="cursor-pointer">
                  <circle r="6" fill="${color}" />
                  <circle r="10" fill="${color}" fill-opacity="0.3" />
                  <text x="12" y="4" font-size="10" fill="#1f2937" font-weight="bold">
                    ${specialist.name.split(' ')[1]}
                  </text>
                </g>
              `;
            }).join('')}
          </svg>
          
          <!-- Leyenda -->
          <div class="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <div class="text-xs font-medium text-gray-700 mb-2">Leyenda</div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span class="text-xs text-gray-600">Tu ubicación</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <span class="text-xs text-gray-600">Disponible</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span class="text-xs text-gray-600">Ocupado</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span class="text-xs text-gray-600">No disponible</span>
              </div>
            </div>
          </div>
          
          <!-- Controles de zoom -->
          <div class="absolute top-4 right-4 bg-white rounded-lg shadow-lg">
            <button class="p-2 hover:bg-gray-100 rounded-t-lg border-b">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button class="p-2 hover:bg-gray-100 rounded-b-lg">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
          </div>
        </div>
      `;

      // Agregar event listeners
      const specialistElements = mapRef.current.querySelectorAll('[data-specialist-id]');
      specialistElements.forEach(element => {
        element.addEventListener('click', (e) => {
          const specialistId = (e.currentTarget as HTMLElement).getAttribute('data-specialist-id');
          const specialist = specialists.find(s => s.id === specialistId);
          if (specialist && onSelectSpecialist) {
            onSelectSpecialist(specialist);
          }
        });
      });
    };

    renderMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
  }, [center, specialists, onSelectSpecialist]);

  return (
    <div ref={mapRef} className="w-full h-full min-h-[16rem]">
      {/* El mapa se renderiza aquí */}
    </div>
  );
}