/**
 * Página de Patient Crystal Ball
 * Vista de predicción de evolución para un paciente específico
 */

'use client';

import { PatientCrystalBall } from '@/components/patient-predictor/PatientCrystalBall';
import { useAuth  } from '@altamedica/auth';;
import { Button } from '@altamedica/ui';
import { ArrowLeft, Brain, Download, Share2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { logger } from '@altamedica/shared/services/logger.service';
export default function PatientCrystalBallPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const patientId = params.id as string;

  const handleInterventionImplemented = (interventionId: string) => {
    logger.info('Intervención implementada:', interventionId);
    // Aquí podrías agregar una notificación de éxito
  };

  const handleAlertResolved = (alertId: string) => {
    logger.info('Alerta resuelta:', alertId);
    // Aquí podrías agregar una notificación de éxito
  };

  const handleExportReport = () => {
    // Implementar exportación a PDF
    logger.info('Exportando reporte...');
  };

  const handleSharePrediction = () => {
    // Implementar compartir con otros médicos
    logger.info('Compartiendo predicción...');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl font-bold">Patient Crystal Ball</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleSharePrediction}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          Predicción de evolución y riesgo de readmisión basada en IA
        </p>
      </div>

      {/* Crystal Ball Component */}
      <PatientCrystalBall
        patientId={patientId}
        onInterventionImplemented={handleInterventionImplemented}
        onAlertResolved={handleAlertResolved}
      />

      {/* Footer con información adicional */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Brain className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-1">Sobre Patient Crystal Ball</h3>
            <p className="text-sm text-muted-foreground">
              Este sistema utiliza inteligencia artificial para analizar múltiples factores de
              riesgo y predecir la probabilidad de readmisión del paciente. Las recomendaciones
              están basadas en evidencia clínica y patrones históricos de miles de casos similares.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Precisión histórica: 85%</span>
              <span>•</span>
              <span>Actualización: Cada 10 minutos</span>
              <span>•</span>
              <span>Modelo: v1.0.0</span>
              <span>•</span>
              <span>Última calibración: Hace 7 días</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
