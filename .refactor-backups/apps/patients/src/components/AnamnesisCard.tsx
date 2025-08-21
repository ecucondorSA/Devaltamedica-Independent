/**
 * Componente AnamnesisCard - Altamedica
 * Muestra información de anamnesis en el dashboard de pacientes
 */

"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Heart,
  Activity,
  Plus,
  ExternalLink,
  Download,
  RefreshCw,
} from 'lucide-react';
import { CardCorporate } from '@altamedica/ui';
import { CardHeaderCorporate, CardContentCorporate } from './CardCorporate';
import { ButtonCorporate } from '@altamedica/ui';
import { LoadingSpinner } from '@altamedica/ui';
import { useAnamnesis } from '../hooks/useAnamnesis';
import { AnamnesisStats } from './AnamnesisStats';

interface AnamnesisCardProps {
  pacienteId: string;
  className?: string;
}

export function AnamnesisCard({ pacienteId, className = '' }: AnamnesisCardProps) {
  const {
    anamnesis,
    loading,
    error,
    refresh,
    hasAnamnesis,
    anamnesisQuality,
    urgencyLevel,
    alerts,
    recommendations
  } = useAnamnesis(pacienteId);
  
  const [showDetails, setShowDetails] = useState(false);



  const handleImportFromGame = () => {
    // Redirigir al juego de anamnesis
    window.open('/anamnesis-juego', '_blank');
  };

  const handleRefresh = () => {
    refresh();
  };

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'crítica': return 'text-red-700 bg-red-100 border-red-200';
      case 'alta': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'media': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'baja': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getUrgenciaText = (urgencia: string) => {
    switch (urgencia) {
      case 'crítica': return 'Crítica';
      case 'alta': return 'Alta';
      case 'media': return 'Media';
      case 'baja': return 'Baja';
      default: return 'No especificada';
    }
  };

  if (loading) {
    return (
      <CardCorporate variant="default" size="md" className={className}>
        <CardContentCorporate className="p-6">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-600">Cargando anamnesis...</span>
          </div>
        </CardContentCorporate>
      </CardCorporate>
    );
  }

  if (error) {
    return (
      <CardCorporate variant="default" size="md" className={className}>
        <CardContentCorporate className="p-6">
          <div className="text-center py-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Error al cargar anamnesis
            </h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <ButtonCorporate
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </ButtonCorporate>
          </div>
        </CardContentCorporate>
      </CardCorporate>
    );
  }

  if (!anamnesis) {
    return (
      <CardCorporate variant="default" size="md" className={className}>
        <CardHeaderCorporate
          title="Anamnesis Médica"
          className="px-6 py-4 border-b border-gray-200"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center text-lg font-medium text-gray-900">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Anamnesis Médica
            </h2>
          </div>
        </CardHeaderCorporate>
        <CardContentCorporate className="p-6">
          <div className="text-center py-8">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No hay anamnesis disponible
            </h3>
            <p className="mb-6 text-gray-600">
              Completa tu anamnesis médica para que los doctores tengan información completa sobre tu salud.
            </p>
            <div className="space-y-3">
              <ButtonCorporate
                variant="primary"
                onClick={handleImportFromGame}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Completar Anamnesis</span>
              </ButtonCorporate>
              <p className="text-xs text-gray-500">
                Se abrirá el juego interactivo de anamnesis
              </p>
            </div>
          </div>
        </CardContentCorporate>
      </CardCorporate>
    );
  }

  return (
    <CardCorporate variant="default" size="md" className={className}>
      <CardHeaderCorporate
        title="Anamnesis Médica"
        className="px-6 py-4 border-b border-gray-200"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center text-lg font-medium text-gray-900">
            <FileText className="w-5 h-5 mr-2 text-indigo-600" />
            Anamnesis Médica
          </h2>
          <div className="flex items-center space-x-2">
            <ButtonCorporate
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </ButtonCorporate>
            <ButtonCorporate
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ocultar' : 'Ver'} detalles
            </ButtonCorporate>
          </div>
        </div>
      </CardHeaderCorporate>
      
      <CardContentCorporate className="p-6">
        {/* Estado y validación */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {anamnesis.estado === 'completada' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium text-gray-900">
                {anamnesis.estado === 'completada' ? 'Completada' : 'En progreso'}
              </span>
            </div>
            
            {anamnesis.validacion && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Calidad:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  anamnesis.validacion.calidad >= 80 ? 'bg-green-100 text-green-700' :
                  anamnesis.validacion.calidad >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {anamnesis.validacion.calidad}%
                </span>
              </div>
            )}
          </div>
          
          <span className="text-sm text-gray-500">
            {new Date(anamnesis.fechaCompletada).toLocaleDateString('es-ES')}
          </span>
        </div>

        {/* Información básica */}
        <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {anamnesis.datos.nombre}
              </p>
              <p className="text-xs text-gray-600">
                {anamnesis.datos.edad} años • {anamnesis.datos.genero}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Motivo de consulta
              </p>
              <p className="text-xs text-gray-600">
                {anamnesis.datos.motivoConsulta}
              </p>
            </div>
          </div>
        </div>

        {/* Análisis clínico */}
        {anamnesis.analisis && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="mb-3 text-sm font-medium text-gray-900">
              Análisis Clínico
            </h4>
            
            <div className="space-y-3">
              {/* Urgencia */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nivel de urgencia:</span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getUrgenciaColor(anamnesis.analisis.urgencia)}`}>
                  {getUrgenciaText(anamnesis.analisis.urgencia)}
                </span>
              </div>
              
              {/* Alertas */}
              {anamnesis.analisis.alertas.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Alertas:</span>
                  <div className="mt-1 space-y-1">
                    {anamnesis.analisis.alertas.map((alerta, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-gray-700">{alerta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Factores de riesgo */}
              {anamnesis.analisis.factoresRiesgo.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Factores de riesgo:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {anamnesis.analisis.factoresRiesgo.map((factor, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detalles expandibles */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Estadísticas de anamnesis */}
            <AnamnesisStats
              completitud={anamnesis?.validacion?.completitud || 0}
              calidad={anamnesisQuality}
              urgencia={urgencyLevel}
              alertas={alerts}
              recomendaciones={recommendations}
              fechaCompletada={anamnesis?.fechaCompletada}
            />
            
            {/* Antecedentes familiares */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                Antecedentes Familiares
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Heart className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Diabetes:</span>
                  <span className={anamnesis?.datos.antecedentesFamiliares.diabetes ? 'text-red-600' : 'text-green-600'}>
                    {anamnesis?.datos.antecedentesFamiliares.diabetes ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Hipertensión:</span>
                  <span className={anamnesis?.datos.antecedentesFamiliares.hipertension ? 'text-red-600' : 'text-green-600'}>
                    {anamnesis?.datos.antecedentesFamiliares.hipertension ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hábitos */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                Hábitos de Vida
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Fuma:</span>
                  <span className={anamnesis?.datos.fuma ? 'text-red-600' : 'text-green-600'}>
                    {anamnesis?.datos.fuma ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Ejercicio:</span>
                  <span className={anamnesis?.datos.ejercicio ? 'text-green-600' : 'text-orange-600'}>
                    {anamnesis?.datos.ejercicio ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen médico */}
            {anamnesis?.resumenMedico && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-900">
                  Resumen Médico
                </h4>
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                  {anamnesis.resumenMedico}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <ButtonCorporate
            variant="ghost"
            size="sm"
            onClick={handleImportFromGame}
            className="flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Actualizar anamnesis</span>
          </ButtonCorporate>
          
          <ButtonCorporate
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar</span>
          </ButtonCorporate>
        </div>
      </CardContentCorporate>
    </CardCorporate>
  );
} 