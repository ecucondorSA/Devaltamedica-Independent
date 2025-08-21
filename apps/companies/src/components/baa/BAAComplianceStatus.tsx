'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Progress
} from '@altamedica/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Info,
  ChevronRight,
  Clock,
  Activity
} from 'lucide-react';
import { BAA } from '@altamedica/types';
import { useToast } from '@/lib/toast';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Componente de Estado de Compliance de BAA
 * Muestra el estado actual del BAA y métricas de cumplimiento
 */

interface BAAComplianceStatusProps {
  companyId: string;
  onStartOnboarding?: () => void;
  onViewDetails?: (baaId: string) => void;
}

interface ComplianceData {
  baaId: string;
  status: string;
  compliance: {
    isCompliant: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
    lastChecked: string;
  };
  metrics: {
    daysUntilExpiration: number | null;
    daysSinceLastReview: number | null;
    requiresUrgentAction: boolean;
  };
  obligations: any;
  signatures: {
    coveredEntity: boolean;
    businessAssociate: boolean;
    bothSigned: boolean;
  };
}

export function BAAComplianceStatus({
  companyId,
  onStartOnboarding,
  onViewDetails
}: BAAComplianceStatusProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baa, setBaa] = useState<BAA | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    checkBAAStatus();
  }, [companyId]);

  // Verificar estado del BAA
  const checkBAAStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/baa/onboarding?companyId=${companyId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data.currentBAA) {
          setBaa(data.data.currentBAA);
          
          // Si hay BAA activo, obtener compliance
          if (data.data.currentBAA.status === 'active') {
            await checkCompliance(data.data.currentBAA.id);
          }
        }
      } else {
        throw new Error('Error al verificar estado del BAA');
      }
    } catch (error: any) {
      setError(error.message);
      logger.error('Error checking BAA status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar compliance
  const checkCompliance = async (baaId: string) => {
    try {
      const response = await fetch(`/api/v1/baa/${baaId}/compliance`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setComplianceData(data.data);
      }
    } catch (error) {
      logger.error('Error checking compliance:', error);
    }
  };

  // Actualizar compliance
  const refreshCompliance = async () => {
    if (!baa) return;

    try {
      setRefreshing(true);
      await checkCompliance(baa.id);
      
      toast({
        title: 'Compliance actualizado',
        description: 'Los datos de compliance han sido actualizados',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el compliance',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Descargar reporte
  const downloadReport = () => {
    if (!complianceData) return;

    const report = `
REPORTE DE COMPLIANCE BAA
==========================

Fecha: ${new Date().toLocaleDateString()}
Empresa: ${companyId}
BAA ID: ${complianceData.baaId}

ESTADO DE COMPLIANCE
--------------------
Estado: ${complianceData.status}
Puntuación: ${complianceData.score}%
Cumplimiento: ${complianceData.isCompliant ? 'SÍ' : 'NO'}

MÉTRICAS
--------
Días hasta expiración: ${complianceData.metrics.daysUntilExpiration || 'N/A'}
Días desde última revisión: ${complianceData.metrics.daysSinceLastReview || 'N/A'}
Requiere acción urgente: ${complianceData.metrics.requiresUrgentAction ? 'SÍ' : 'NO'}

PROBLEMAS IDENTIFICADOS
-----------------------
${complianceData.compliance.issues.join('\n') || 'Ninguno'}

RECOMENDACIONES
---------------
${complianceData.compliance.recommendations.join('\n') || 'Ninguna'}

FIRMAS
------
Entidad Cubierta: ${complianceData.signatures.coveredEntity ? 'Firmado' : 'Pendiente'}
Asociado de Negocio: ${complianceData.signatures.businessAssociate ? 'Firmado' : 'Pendiente'}
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${complianceData.baaId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calcular color de score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calcular variant de badge
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending_signature':
        return 'secondary';
      case 'expired':
      case 'terminated':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Renderizar estado sin BAA
  if (!loading && !baa) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Associate Agreement</CardTitle>
              <CardDescription>
                Configure el acuerdo de cumplimiento HIPAA
              </CardDescription>
            </div>
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No tiene un BAA activo. Es necesario completar el proceso de onboarding 
              para operar en la plataforma con cumplimiento HIPAA.
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button onClick={onStartOnboarding} className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Iniciar Proceso de Onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar loading
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar con BAA pero sin compliance (pending)
  if (baa && !complianceData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Associate Agreement</CardTitle>
              <CardDescription>Estado del acuerdo</CardDescription>
            </div>
            <Shield className="h-8 w-8 text-yellow-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado</span>
              <Badge variant={getStatusBadgeVariant(baa.status)}>
                {baa.status}
              </Badge>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                El BAA está en proceso. Complete todos los pasos para activarlo.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => onViewDetails && onViewDetails(baa.id)}
              className="w-full"
            >
              Continuar Proceso
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar con compliance completo
  return (
    <div className="space-y-6">
      {/* Card Principal de Compliance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estado de Compliance BAA</CardTitle>
              <CardDescription>
                Última verificación: {complianceData?.compliance.lastChecked 
                  ? new Date(complianceData.compliance.lastChecked).toLocaleString()
                  : 'N/A'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCompliance}
                disabled={refreshing}
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadReport}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Principal */}
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(complianceData?.compliance.score || 0)}`}>
              {complianceData?.compliance.score || 0}%
            </div>
            <p className="text-sm text-gray-600 mt-2">Puntuación de Compliance</p>
            <Progress 
              value={complianceData?.compliance.score || 0} 
              className="mt-4"
            />
          </div>

          {/* Métricas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <p className="text-lg font-semibold">
                      {complianceData?.compliance.isCompliant ? 'Compliant' : 'No Compliant'}
                    </p>
                  </div>
                  {complianceData?.compliance.isCompliant ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expira en</p>
                    <p className="text-lg font-semibold">
                      {complianceData?.metrics.daysUntilExpiration 
                        ? `${complianceData.metrics.daysUntilExpiration} días`
                        : 'N/A'}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Última Revisión</p>
                    <p className="text-lg font-semibold">
                      {complianceData?.metrics.daysSinceLastReview 
                        ? `Hace ${complianceData.metrics.daysSinceLastReview} días`
                        : 'Nunca'}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas de Acción Urgente */}
          {complianceData?.metrics.requiresUrgentAction && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Acción Urgente Requerida:</strong> Su BAA requiere atención inmediata. 
                {complianceData.metrics.daysUntilExpiration && complianceData.metrics.daysUntilExpiration < 30 &&
                  ` El acuerdo expira en ${complianceData.metrics.daysUntilExpiration} días.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Problemas y Recomendaciones */}
          {complianceData?.compliance.issues && complianceData.compliance.issues.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Problemas Identificados</h3>
              <div className="space-y-2">
                {complianceData.compliance.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span className="text-sm">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {complianceData?.compliance.recommendations && complianceData.compliance.recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Recomendaciones</h3>
              <div className="space-y-2">
                {complianceData.compliance.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado de Firmas */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado de Firmas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Entidad Cubierta</span>
                {complianceData?.signatures.coveredEntity ? (
                  <Badge variant="outline" className="bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Firmado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendiente
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Asociado de Negocio</span>
                {complianceData?.signatures.businessAssociate ? (
                  <Badge variant="outline" className="bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Firmado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendiente
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Obligaciones */}
      {complianceData?.obligations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Obligaciones Aceptadas</CardTitle>
            <CardDescription>
              Compromisos de cumplimiento HIPAA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries({
                'Salvaguardas de Seguridad': complianceData.obligations.implementSafeguards,
                'Notificación de Brechas': complianceData.obligations.reportBreaches,
                'Uso Permitido de PHI': complianceData.obligations.useOnlyAsPermitted,
                'Auditorías Permitidas': complianceData.obligations.allowAudits,
                'Destrucción Segura': complianceData.obligations.secureDestruction,
                'Devolución de PHI': complianceData.obligations.returnPHIOnTermination
              }).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{key}</span>
                  {value ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>

            {complianceData.obligations.breachNotificationPeriod && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Período de Notificación de Brechas
                  </span>
                  <Badge variant="outline">
                    {complianceData.obligations.breachNotificationPeriod} días
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex gap-3">
        <Button 
          onClick={() => onViewDetails && baa && onViewDetails(baa.id)}
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          Ver Detalles del BAA
        </Button>
        <Button 
          variant="outline"
          onClick={downloadReport}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar Reporte Completo
        </Button>
      </div>
    </div>
  );
}