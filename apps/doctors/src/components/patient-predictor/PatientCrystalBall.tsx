/**
 * Patient Crystal Ball Component
 * Visualización de predicciones de evolución y readmisión de pacientes
 * Incluye recomendaciones de IA y plan de seguimiento
 */

'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Heart,
  Home,
  Phone,
  RefreshCw,
  Shield,
  Stethoscope,
  Target,
  ThermometerSun,
  TrendingUp,
  User,
  Video,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePatientPredictor } from '../../hooks-stub';
import { cn } from '../../utils-stub';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Progress,
  ScrollArea,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../ui-stub';

interface PatientCrystalBallProps {
  patientId: string;
  className?: string;
  onInterventionImplemented?: (interventionId: string) => void;
  onAlertResolved?: (alertId: string) => void;
}

export function PatientCrystalBall({
  patientId,
  className,
  onInterventionImplemented,
  onAlertResolved,
}: PatientCrystalBallProps) {
  const {
    prediction,
    alerts,
    isLoading,
    alertsLoading,
    error,
    selectedTimeframe,
    setSelectedTimeframe,
    generatePrediction,
    implementIntervention,
    resolveAlert,
    refreshPrediction,
    isGenerating,
    getRiskColor,
    getPriorityInterventions,
    hasCriticalAlerts,
    getPredictionSummary,
  } = usePatientPredictor(patientId) as any;

  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null);
  const [implementationNotes, setImplementationNotes] = useState('');
  const [showImplementDialog, setShowImplementDialog] = useState(false);

  const summary = getPredictionSummary();
  const priorityInterventions = getPriorityInterventions();

  // Auto-generar predicción si no existe
  useEffect(() => {
    if (!prediction && !isLoading && !error && patientId) {
      generatePrediction({
        patientId,
        includeInterventions: true,
        includeFollowUpPlan: true,
        timeframes: ['24h', '48h', '72h'],
      });
    }
  }, [prediction, isLoading, error, patientId, generatePrediction]);

  if (isLoading || isGenerating) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Brain className="h-12 w-12 text-blue-500 animate-pulse" />
            <div className="text-center">
              <p className="text-lg font-medium">Analizando datos del paciente...</p>
              <p className="text-sm text-muted-foreground mt-2">
                La IA está procesando factores de riesgo y generando predicciones
              </p>
            </div>
            <Progress value={33} className="w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error al cargar predicción</AlertTitle>
        <AlertDescription>
          No se pudo generar la predicción. Por favor, intente nuevamente.
          <Button variant="outline" size="sm" className="ml-4" onClick={() => refreshPrediction()}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!prediction || !summary) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header con resumen de riesgo */}
      <Card
        className="border-2"
        style={{
          borderColor:
            summary.riskLevel === 'critical'
              ? '#ef4444'
              : summary.riskLevel === 'high'
                ? '#f97316'
                : summary.riskLevel === 'moderate'
                  ? '#eab308'
                  : '#22c55e',
        }}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                Patient Crystal Ball - Predicción de Evolución
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <User className="h-4 w-4" />
                {summary.patientName} • {summary.age} años • {summary.diagnosis}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasCriticalAlerts() && (
                <Badge variant="destructive" className="animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  Alerta Crítica
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => refreshPrediction()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Indicador de riesgo principal */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Riesgo de Readmisión (72h)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={cn('text-4xl font-bold', getRiskColor(summary.riskLevel))}>
                    {summary.riskPercentage}%
                  </span>
                  <Badge
                    variant={
                      summary.riskLevel === 'critical'
                        ? 'destructive'
                        : summary.riskLevel === 'high'
                          ? 'destructive'
                          : summary.riskLevel === 'moderate'
                            ? 'secondary'
                            : 'default'
                    }
                  >
                    {summary.riskLevel === 'critical'
                      ? 'CRÍTICO'
                      : summary.riskLevel === 'high'
                        ? 'ALTO'
                        : summary.riskLevel === 'moderate'
                          ? 'MODERADO'
                          : 'BAJO'}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Confianza IA</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={summary.confidence} className="w-24" />
                  <span className="text-sm font-medium">{summary.confidence}%</span>
                </div>
              </div>
            </div>

            {/* Factores principales */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Factores de Riesgo Principales:</p>
              <div className="space-y-1">
                {summary.mainFactors.map((factor: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acción principal recomendada */}
            <Alert className="mt-4">
              <Zap className="h-4 w-4" />
              <AlertTitle>Recomendación Principal</AlertTitle>
              <AlertDescription className="mt-2">{summary.primaryAction}</AlertDescription>
            </Alert>
          </div>

          {/* Tabs con detalles */}
          <Tabs defaultValue="interventions" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="interventions">
                <Target className="h-4 w-4 mr-2" />
                Intervenciones
              </TabsTrigger>
              <TabsTrigger value="followup">
                <Calendar className="h-4 w-4 mr-2" />
                Seguimiento
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <Bell className="h-4 w-4 mr-2" />
                Alertas ({alerts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Detalles
              </TabsTrigger>
            </TabsList>

            {/* Tab de Intervenciones */}
            <TabsContent value="interventions" className="mt-4 space-y-3">
              {priorityInterventions.length > 0 ? (
                priorityInterventions.map((intervention: any) => (
                  <Card key={intervention.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              intervention.priority === 'urgent'
                                ? 'destructive'
                                : intervention.priority === 'high'
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {intervention.priority === 'urgent'
                              ? 'URGENTE'
                              : intervention.priority === 'high'
                                ? 'ALTA'
                                : intervention.priority === 'medium'
                                  ? 'MEDIA'
                                  : 'BAJA'}
                          </Badge>
                          <CardTitle className="text-base">{intervention.title}</CardTitle>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedIntervention(intervention.id);
                                setShowImplementDialog(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Implementar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Implementar Intervención</DialogTitle>
                              <DialogDescription>{intervention.title}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div>
                                <Label>Notas de implementación</Label>
                                <Textarea
                                  value={implementationNotes}
                                  onChange={(e: any) => setImplementationNotes(e.target.value)}
                                  placeholder="Describa cómo se implementó esta intervención..."
                                  className="mt-2"
                                />
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => {
                                  implementIntervention({
                                    interventionId: intervention.id,
                                    notes: implementationNotes,
                                  });
                                  setShowImplementDialog(false);
                                  setImplementationNotes('');
                                  onInterventionImplemented?.(intervention.id);
                                }}
                              >
                                Confirmar Implementación
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {intervention.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">Impacto:</span>
                          <span className="font-medium">{intervention.expectedImpact}</span>
                        </div>
                        {intervention.implementationTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span className="text-muted-foreground">Tiempo:</span>
                            <span className="font-medium">{intervention.implementationTime}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No se requieren intervenciones urgentes</p>
                  <p className="text-sm mt-1">El paciente tiene bajo riesgo de readmisión</p>
                </div>
              )}
            </TabsContent>

            {/* Tab de Seguimiento */}
            <TabsContent value="followup" className="mt-4">
              {prediction.followUpPlan ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Calendario de Seguimiento</h4>
                    <div className="space-y-2">
                      {prediction.followUpPlan.schedule.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                          {item.type === 'phone_call' && (
                            <Phone className="h-4 w-4 text-blue-500" />
                          )}
                          {item.type === 'video_consultation' && (
                            <Video className="h-4 w-4 text-purple-500" />
                          )}
                          {item.type === 'in_person' && <User className="h-4 w-4 text-green-500" />}
                          {item.type === 'home_visit' && (
                            <Home className="h-4 w-4 text-orange-500" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.purpose}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.date), "d 'de' MMMM 'a las' HH:mm", {
                                locale: es,
                              })}
                              {item.provider && ` • ${item.provider}`}
                            </p>
                          </div>
                          <Badge variant={item.status === 'scheduled' ? 'default' : 'secondary'}>
                            {item.status === 'scheduled'
                              ? 'Programado'
                              : item.status === 'completed'
                                ? 'Completado'
                                : item.status === 'missed'
                                  ? 'Perdido'
                                  : 'Cancelado'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Parámetros de Monitoreo</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {prediction.followUpPlan.monitoringParameters.map((param: any, idx: number) => (
                        <Card key={idx}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-2">
                              <Activity className="h-4 w-4 text-blue-500 mt-1" />
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{param.parameter}</p>
                                <p className="text-xs text-muted-foreground">
                                  Frecuencia: {param.frequency}
                                </p>
                                <p className="text-xs">
                                  <span className="text-green-600">
                                    Normal: {param.normalRange}
                                  </span>
                                  {' • '}
                                  <span className="text-red-600">
                                    Crítico: {param.criticalValues}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3" />
                  <p>No hay plan de seguimiento programado</p>
                </div>
              )}
            </TabsContent>

            {/* Tab de Alertas */}
            <TabsContent value="alerts" className="mt-4">
              <ScrollArea className="h-[400px]">
                {alerts && alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert: any) => (
                      <Alert
                        key={alert.id}
                        variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="flex items-center justify-between">
                          <span>{alert.message}</span>
                          <Badge variant={alert.autoResolved ? 'secondary' : 'default'}>
                            {alert.autoResolved ? 'Resuelto' : 'Activo'}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">
                              {format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm')}
                            </span>
                            {!alert.autoResolved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  resolveAlert({
                                    alertId: alert.id,
                                    resolution: 'Revisado por médico',
                                  });
                                  onAlertResolved?.(alert.id);
                                }}
                              >
                                Resolver
                              </Button>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>No hay alertas activas</p>
                    <p className="text-sm mt-1">El sistema monitorea continuamente</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Tab de Detalles */}
            <TabsContent value="details" className="mt-4">
              <div className="space-y-4">
                {/* Datos clínicos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Marcadores Clínicos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {prediction.predictions.readmission.clinicalMarkers?.vitalSigns && (
                        <>
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                              FC:{' '}
                              {
                                prediction.predictions.readmission.clinicalMarkers.vitalSigns
                                  .heartRate
                              }{' '}
                              lpm
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">
                              SpO2:{' '}
                              {
                                prediction.predictions.readmission.clinicalMarkers.vitalSigns
                                  .oxygenSaturation
                              }
                              %
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ThermometerSun className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">
                              Temp:{' '}
                              {
                                prediction.predictions.readmission.clinicalMarkers.vitalSigns
                                  .temperature
                              }
                              °C
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">
                              PA:{' '}
                              {
                                prediction.predictions.readmission.clinicalMarkers.vitalSigns
                                  .bloodPressure
                              }
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Determinantes sociales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Determinantes Sociales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {prediction.predictions.readmission.socialDeterminants && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Vive solo</span>
                            <Badge
                              variant={
                                prediction.predictions.readmission.socialDeterminants.livesAlone
                                  ? 'destructive'
                                  : 'default'
                              }
                            >
                              {prediction.predictions.readmission.socialDeterminants.livesAlone
                                ? 'Sí'
                                : 'No'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Tiene cuidador</span>
                            <Badge
                              variant={
                                prediction.predictions.readmission.socialDeterminants.hasCaregiver
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {prediction.predictions.readmission.socialDeterminants.hasCaregiver
                                ? 'Sí'
                                : 'No'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Acceso a transporte</span>
                            <Badge
                              variant={
                                prediction.predictions.readmission.socialDeterminants
                                  .transportationAccess
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {prediction.predictions.readmission.socialDeterminants
                                .transportationAccess
                                ? 'Sí'
                                : 'No'}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Metadata del modelo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Información del Modelo IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Versión</span>
                        <span>{prediction.metadata.modelVersion}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Calidad de datos</span>
                        <div className="flex items-center gap-2">
                          <Progress value={prediction.metadata.dataQuality} className="w-20" />
                          <span>{prediction.metadata.dataQuality}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Puntos de datos</span>
                        <span>{prediction.metadata.dataPoints}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Precisión histórica</span>
                        <span>
                          {prediction.metadata.accuracy.historical
                            ? `${prediction.metadata.accuracy.historical * 100}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alertas críticas flotantes */}
      {hasCriticalAlerts() && (
        <Alert variant="destructive" className="animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>¡Atención Requerida!</AlertTitle>
          <AlertDescription>
            Hay alertas críticas que requieren su atención inmediata. Revise la pestaña de alertas
            para más detalles.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
