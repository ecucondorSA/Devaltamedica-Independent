'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useEffect, useRef } from 'react';

import { Doctor } from '@altamedica/types';
  rating: number;
  experience: number;
  hourlyRate: number;
  isOnline: boolean;
  isUrgentAvailable: boolean;
  verificationStatus: string;

interface Hospital {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  type: string;
  totalHires: number;
  urgentJobs: number;
  rating: number;

interface LeafletMapCoreProps {
  doctors: Doctor[];
  hospitals: Hospital[];
  interactive: boolean;

export function LeafletMapCore({ doctors, hospitals, interactive }: LeafletMapCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Stub: evitar cargar leaflet en versión marketing
    return undefined
  }, [doctors, hospitals, interactive])

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg border border-slate-200">
      <div className="text-center space-y-2 p-6">
        <div className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center mx-auto mb-2">🗺️</div>
        <h3 className="font-semibold text-slate-800">Mapa Interactivo Deshabilitado</h3>
        <p className="text-sm text-slate-600 max-w-xs">
          El mapa de profesionales y hospitales está disponible en las aplicaciones funcionales. Este portal solo muestra contenido informativo.
        </p>
      </div>
    </div>
  )
