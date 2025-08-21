'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { cn } from '@altamedica/utils';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  AlertTriangle,
  Activity,
  Users,
  Building2,
  MapPin,
  Clock,
  TrendingUp,
  UserPlus,
  ArrowRight,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface HospitalData {
  id: string;
  name: string;
  location: string;
  currentCapacity: number;
  maxCapacity: number;
  urgencyCapacity: number;
  urgencyMax: number;
  specialtyNeeds: SpecialtyNeed[];
  lastUpdate: Date;
  status: 'optimal' | 'moderate' | 'critical' | 'overflow';
  redistributionSuggestions: RedistributionSuggestion[];
}

interface SpecialtyNeed {
  specialty: string;
  needed: number;
  available: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedWaitTime: number;
}

interface RedistributionSuggestion {
  targetHospital: string;
  patientCount: number;
  specialty: string;
  distance: number;
  estimatedTime: number;
  confidence: number;
}

interface HospitalSaturationMonitorProps {
  hospitalId?: string;
  showRedistribution?: boolean;
  compact?: boolean;
}

// Mock data para demostración
const mockHospitalData: HospitalData[] = [
  {
    id: 'HOSP-001',
    name: 'Hospital San Vicente',
    location: 'Centro, Medellín',
    currentCapacity: 245,
    maxCapacity: 280,
    urgencyCapacity: 23,
    urgencyMax: 25,
    lastUpdate: new Date(),
    status: 'critical',
    specialtyNeeds: [
      { specialty: 'Cardiología', needed: 3, available: 1, priority: 'critical', estimatedWaitTime: 45 },
      { specialty: 'Neurología', needed: 2, available: 1, priority: 'high', estimatedWaitTime: 30 },
      { specialty: 'Pediatría', needed: 1, available: 2, priority: 'low', estimatedWaitTime: 15 }
    ],
    redistributionSuggestions: [
      { targetHospital: 'Hospital Las Américas', patientCount: 8, specialty: 'General', distance: 5.2, estimatedTime: 15, confidence: 92 },
      { targetHospital: 'Clínica El Poblado', patientCount: 5, specialty: 'Cardiología', distance: 7.8, estimatedTime: 20, confidence: 88 }
    ]
  },
  {
    id: 'HOSP-002', 
    name: 'Hospital Las Américas',
    location: 'Las Américas, Medellín',
    currentCapacity: 180,
    maxCapacity: 320,
    urgencyCapacity: 12,
    urgencyMax: 30,
    lastUpdate: new Date(),
    status: 'optimal',
    specialtyNeeds: [
      { specialty: 'Cardiología', needed: 0, available: 3, priority: 'low', estimatedWaitTime: 10 },
      { specialty: 'Neurología', needed: 1, available: 2, priority: 'medium', estimatedWaitTime: 20 }
    ],
    redistributionSuggestions: []
  }
];

export function HospitalSaturationMonitor({ 
  hospitalId, 
  showRedistribution = true, 
  compact = false 
}: HospitalSaturationMonitorProps) {
  const [hospitalData, setHospitalData] = useState<HospitalData[]>(mockHospitalData);
  const [selectedHospital, setSelectedHospital] = useState<HospitalData | null>(null);
  const [autoRedistribution, setAutoRedistribution] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const hospital = hospitalId 
      ? hospitalData.find(h => h.id === hospitalId)
      : hospitalData.find(h => h.status === 'critical') || hospitalData[0];
    
    setSelectedHospital(hospital || null);
  }, [hospitalId, hospitalData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'overflow': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="h-4 w-4" />;
      case 'moderate': return <Clock className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'overflow': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const executeRedistribution = async (suggestion: RedistributionSuggestion) => {
    setIsProcessing(true);
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Aquí iría la lógica real de redistribución
    logger.info('Ejecutando redistribución:', suggestion);
    
    setIsProcessing(false);
  };

  const publishJobOffer = async (specialty: SpecialtyNeed) => {
    setIsProcessing(true);
    // Simular publicación de oferta
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Aquí iría la lógica real de publicación en el marketplace
    logger.info('Publicando oferta para:', specialty);
    
    setIsProcessing(false);
  };

  if (!selectedHospital) return null;

  return (
    <div className="space-y-4">
      {/* Panel Principal de Saturación */}
      <Card className={cn("border-l-4", getStatusColor(selectedHospital.status))}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-lg", getStatusColor(selectedHospital.status))}>
                {getStatusIcon(selectedHospital.status)}
              </div>
              <div>
                <CardTitle className="text-lg">{selectedHospital.name}</CardTitle>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {selectedHospital.location}
                </p>
              </div>
            </div>
            <Badge className={cn("text-xs", getStatusColor(selectedHospital.status))}>
              {selectedHospital.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Capacidad General */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Capacidad General</span>
                <Building2 className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-end space-x-1">
                <span className="text-2xl font-bold">{selectedHospital.currentCapacity}</span>
                <span className="text-sm text-gray-500">/ {selectedHospital.maxCapacity}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    selectedHospital.currentCapacity / selectedHospital.maxCapacity > 0.9 
                      ? "bg-red-500" 
                      : selectedHospital.currentCapacity / selectedHospital.maxCapacity > 0.7 
                        ? "bg-yellow-500" 
                        : "bg-green-500"
                  )}
                  style={{ 
                    width: `${(selectedHospital.currentCapacity / selectedHospital.maxCapacity) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((selectedHospital.currentCapacity / selectedHospital.maxCapacity) * 100)}% ocupación
              </p>
            </div>

            {/* Urgencias */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Urgencias</span>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex items-end space-x-1">
                <span className="text-2xl font-bold text-orange-600">{selectedHospital.urgencyCapacity}</span>
                <span className="text-sm text-gray-500">/ {selectedHospital.urgencyMax}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="h-2 rounded-full bg-orange-500 transition-all duration-500"
                  style={{ 
                    width: `${(selectedHospital.urgencyCapacity / selectedHospital.urgencyMax) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((selectedHospital.urgencyCapacity / selectedHospital.urgencyMax) * 100)}% ocupación
              </p>
            </div>

            {/* Tiempo Promedio */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Tiempo Promedio</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex items-end space-x-1">
                <span className="text-2xl font-bold text-blue-600">28</span>
                <span className="text-sm text-gray-500">min</span>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">-5 min vs ayer</span>
              </div>
            </div>
          </div>

          {/* Necesidades de Especialistas */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2 text-purple-600" />
              Necesidades de Personal Especializado
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedHospital.specialtyNeeds.map((need, index) => (
                <div key={index} className="bg-white rounded-md p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{need.specialty}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        need.priority === 'critical' ? 'text-red-600 border-red-300' :
                        need.priority === 'high' ? 'text-orange-600 border-orange-300' :
                        need.priority === 'medium' ? 'text-yellow-600 border-yellow-300' :
                        'text-green-600 border-green-300'
                      )}
                    >
                      {need.priority}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Necesarios: {need.needed} | Disponibles: {need.available}
                  </div>
                  <div className="text-xs text-gray-500 mb-2 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Espera: {need.estimatedWaitTime} min
                  </div>
                  {need.needed > need.available && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full text-xs h-7"
                      onClick={() => publishJobOffer(need)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3 mr-1" />
                      )}
                      Publicar Oferta
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sistema de Redistribución Inteligente */}
          {showRedistribution && selectedHospital.redistributionSuggestions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center text-blue-900">
                  <Zap className="h-4 w-4 mr-2" />
                  Sistema de Redistribución Inteligente
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-700">Auto-Redistribución</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRedistribution}
                      onChange={(e) => setAutoRedistribution(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedHospital.redistributionSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white rounded-md p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium text-sm">{suggestion.targetHospital}</span>
                          <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-700">
                            {suggestion.confidence}% confianza
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                          <span>📍 {suggestion.distance} km - {suggestion.estimatedTime} min</span>
                          <span>👥 {suggestion.patientCount} pacientes - {suggestion.specialty}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="ml-3 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                        onClick={() => executeRedistribution(suggestion)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          "Ejecutar"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                💡 <strong>IA Predictiva:</strong> El sistema detectó saturación crítica y sugiere redistribuir 
                {selectedHospital.redistributionSuggestions.reduce((acc, s) => acc + s.patientCount, 0)} pacientes 
                para optimizar tiempos de atención en {selectedHospital.redistributionSuggestions.length} centros cercanos.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mini Dashboard de Red */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitalData.filter(h => h.id !== selectedHospital.id).map((hospital) => (
            <Card key={hospital.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedHospital(hospital)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{hospital.name}</h5>
                  <Badge className={cn("text-xs", getStatusColor(hospital.status))}>
                    {hospital.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{hospital.currentCapacity}/{hospital.maxCapacity} ocupación</span>
                  <span>{Math.round((hospital.currentCapacity / hospital.maxCapacity) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      hospital.currentCapacity / hospital.maxCapacity > 0.9 ? "bg-red-500" : 
                      hospital.currentCapacity / hospital.maxCapacity > 0.7 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${(hospital.currentCapacity / hospital.maxCapacity) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}