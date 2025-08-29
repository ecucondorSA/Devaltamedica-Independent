'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Label,
  Alert,
  AlertDescription,
  AlertTitle,
  Progress,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@altamedica/ui';
import {
  FileText,
  Download,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  FileJson,
  FileSpreadsheet,
  Archive,
  Heart,
  Lock,
  Calendar,
  User,
  Activity,
  Pill,
  Stethoscope,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { useToast } from '@altamedica/ui';
import type { ExportFormat, ExportScope } from '@altamedica/shared';

interface PatientDataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

interface ExportOptions {
  includePersonalInfo: boolean;
  includeMedicalHistory: boolean;
  includePrescriptions: boolean;
  includeLabResults: boolean;
  includeImagingStudies: boolean;
  includeAppointments: boolean;
  includeTelemedicine: boolean;
  includeInsurance: boolean;
  includeBilling: boolean;
  includeConsents: boolean;
  includeAuditLogs: boolean;
}

const FORMAT_ICONS = {
  json: FileJson,
  pdf: FileText,
  csv: FileSpreadsheet,
  zip: Archive,
  fhir: Heart,
};

const FORMAT_DESCRIPTIONS = {
  json: 'Formato estructurado para desarrolladores y sistemas',
  pdf: 'Documento legible para imprimir o compartir',
  csv: 'Hoja de cálculo para análisis de datos',
  zip: 'Archivo comprimido con múltiples documentos',
  fhir: 'Estándar internacional de intercambio médico',
};

const SCOPE_DESCRIPTIONS = {
  complete: 'Incluye toda su información médica disponible',
  'last-year': 'Información de los últimos 12 meses',
  'last-5-years': 'Información de los últimos 5 años',
  custom: 'Seleccione un rango de fechas personalizado',
};

export default function PatientDataExportModal({
  isOpen,
  onClose,
  patientId,
  patientName,
}: PatientDataExportModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('format');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedScope, setSelectedScope] = useState<ExportScope>('complete');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<string>('~5-10 MB');
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includePersonalInfo: true,
    includeMedicalHistory: true,
    includePrescriptions: true,
    includeLabResults: true,
    includeImagingStudies: true,
    includeAppointments: true,
    includeTelemedicine: true,
    includeInsurance: true,
    includeBilling: false,
    includeConsents: true,
    includeAuditLogs: false,
  });

  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const handleExportRequest = async () => {
    setIsProcessing(true);
    setExportStatus('processing');
    setExportProgress(0);

    try {
      // Simular progreso de exportación
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Llamar a la API de exportación
      const response = await fetch('/api/v1/patients/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          format: selectedFormat,
          scope: selectedScope,
          options: exportOptions,
          dateRange: selectedScope === 'custom' ? customDateRange : undefined,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Error al procesar la solicitud de exportación');
      }

      const data = await response.json();
      
      setExportProgress(100);
      setExportStatus('completed');
      setDownloadUrl(data.downloadUrl);

      toast({
        title: '✅ Exportación completada',
        description: 'Su información médica está lista para descargar',
      });
    } catch (error) {
      setExportStatus('error');
      toast({
        title: '❌ Error en la exportación',
        description: 'No se pudo completar la exportación. Por favor, intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      toast({
        title: 'Descarga iniciada',
        description: 'Su archivo se está descargando',
      });
    }
  };

  const handleOptionChange = (option: keyof ExportOptions) => {
    setExportOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
    
    // Actualizar estimación de tamaño
    const selectedCount = Object.values({ ...exportOptions, [option]: !exportOptions[option] })
      .filter(Boolean).length;
    
    if (selectedCount <= 3) setEstimatedSize('~1-3 MB');
    else if (selectedCount <= 6) setEstimatedSize('~5-10 MB');
    else if (selectedCount <= 9) setEstimatedSize('~10-20 MB');
    else setEstimatedSize('~20-50 MB');
  };

  const canProceed = () => {
    if (activeTab === 'format') return true;
    if (activeTab === 'scope') return selectedScope !== 'custom' || (customDateRange.startDate && customDateRange.endDate);
    if (activeTab === 'options') return Object.values(exportOptions).some(Boolean);
    return false;
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'format': return <FileText className="w-4 h-4" />;
      case 'scope': return <Calendar className="w-4 h-4" />;
      case 'options': return <FileCheck className="w-4 h-4" />;
      case 'review': return <Shield className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Download className="w-6 h-6 text-blue-600" />
            Exportar Mi Información Médica
          </DialogTitle>
          <DialogDescription>
            Solicite una copia completa de su historia clínica según sus derechos bajo HIPAA y Ley 26.529
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Información del paciente */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">{patientName}</p>
                <p className="text-sm text-gray-600">ID: {patientId}</p>
              </div>
            </div>
          </div>

          {exportStatus === 'idle' || exportStatus === 'processing' ? (
            <>
              {/* Tabs de configuración */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="format" className="flex items-center gap-2">
                    {getTabIcon('format')}
                    <span className="hidden sm:inline">Formato</span>
                  </TabsTrigger>
                  <TabsTrigger value="scope" className="flex items-center gap-2">
                    {getTabIcon('scope')}
                    <span className="hidden sm:inline">Período</span>
                  </TabsTrigger>
                  <TabsTrigger value="options" className="flex items-center gap-2">
                    {getTabIcon('options')}
                    <span className="hidden sm:inline">Contenido</span>
                  </TabsTrigger>
                  <TabsTrigger value="review" className="flex items-center gap-2">
                    {getTabIcon('review')}
                    <span className="hidden sm:inline">Revisar</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Formato */}
                <TabsContent value="format" className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Seleccione el formato de exportación</h3>
                  <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
                    <div className="space-y-3">
                      {Object.entries(FORMAT_ICONS).map(([format, Icon]) => (
                        <div key={format} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value={format} id={format} className="mt-1" />
                          <Label htmlFor={format} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-gray-600" />
                              <div>
                                <p className="font-medium">{format.toUpperCase()}</p>
                                <p className="text-sm text-gray-600">
                                  {FORMAT_DESCRIPTIONS[format as ExportFormat]}
                                </p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </TabsContent>

                {/* Tab: Período */}
                <TabsContent value="scope" className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Seleccione el período de tiempo</h3>
                  <RadioGroup value={selectedScope} onValueChange={(value) => setSelectedScope(value as ExportScope)}>
                    <div className="space-y-3">
                      {Object.entries(SCOPE_DESCRIPTIONS).map(([scope, description]) => (
                        <div key={scope} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value={scope} id={scope} className="mt-1" />
                          <Label htmlFor={scope} className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium capitalize">{scope.replace('-', ' ')}</p>
                              <p className="text-sm text-gray-600">{description}</p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {selectedScope === 'custom' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Fecha de inicio</Label>
                          <input
                            type="date"
                            id="startDate"
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            value={customDateRange.startDate}
                            onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">Fecha de fin</Label>
                          <input
                            type="date"
                            id="endDate"
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            value={customDateRange.endDate}
                            onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Contenido */}
                <TabsContent value="options" className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Seleccione qué información incluir</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Información Personal */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Información Personal
                        </h4>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="personalInfo"
                              checked={exportOptions.includePersonalInfo}
                              onCheckedChange={() => handleOptionChange('includePersonalInfo')}
                            />
                            <Label htmlFor="personalInfo" className="text-sm">Datos personales y contacto</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="insurance"
                              checked={exportOptions.includeInsurance}
                              onCheckedChange={() => handleOptionChange('includeInsurance')}
                            />
                            <Label htmlFor="insurance" className="text-sm">Información de seguro</Label>
                          </div>
                        </div>
                      </div>

                      {/* Historia Médica */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          Historia Médica
                        </h4>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="medicalHistory"
                              checked={exportOptions.includeMedicalHistory}
                              onCheckedChange={() => handleOptionChange('includeMedicalHistory')}
                            />
                            <Label htmlFor="medicalHistory" className="text-sm">Diagnósticos y condiciones</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="prescriptions"
                              checked={exportOptions.includePrescriptions}
                              onCheckedChange={() => handleOptionChange('includePrescriptions')}
                            />
                            <Label htmlFor="prescriptions" className="text-sm">Medicamentos y recetas</Label>
                          </div>
                        </div>
                      </div>

                      {/* Estudios y Resultados */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Estudios y Resultados
                        </h4>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="labResults"
                              checked={exportOptions.includeLabResults}
                              onCheckedChange={() => handleOptionChange('includeLabResults')}
                            />
                            <Label htmlFor="labResults" className="text-sm">Resultados de laboratorio</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="imagingStudies"
                              checked={exportOptions.includeImagingStudies}
                              onCheckedChange={() => handleOptionChange('includeImagingStudies')}
                            />
                            <Label htmlFor="imagingStudies" className="text-sm">Estudios de imagen</Label>
                          </div>
                        </div>
                      </div>

                      {/* Citas y Visitas */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Citas y Visitas
                        </h4>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="appointments"
                              checked={exportOptions.includeAppointments}
                              onCheckedChange={() => handleOptionChange('includeAppointments')}
                            />
                            <Label htmlFor="appointments" className="text-sm">Historial de citas</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="telemedicine"
                              checked={exportOptions.includeTelemedicine}
                              onCheckedChange={() => handleOptionChange('includeTelemedicine')}
                            />
                            <Label htmlFor="telemedicine" className="text-sm">Sesiones de telemedicina</Label>
                          </div>
                        </div>
                      </div>

                      {/* Administrativo */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Administrativo
                        </h4>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="billing"
                              checked={exportOptions.includeBilling}
                              onCheckedChange={() => handleOptionChange('includeBilling')}
                            />
                            <Label htmlFor="billing" className="text-sm">Información de facturación</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="consents"
                              checked={exportOptions.includeConsents}
                              onCheckedChange={() => handleOptionChange('includeConsents')}
                            />
                            <Label htmlFor="consents" className="text-sm">Consentimientos firmados</Label>
                          </div>
                        </div>
                      </div>

                      {/* Auditoría */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Auditoría y Seguridad
                        </h4>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="auditLogs"
                              checked={exportOptions.includeAuditLogs}
                              onCheckedChange={() => handleOptionChange('includeAuditLogs')}
                            />
                            <Label htmlFor="auditLogs" className="text-sm">Registros de acceso</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estimación de tamaño */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tamaño estimado del archivo:</span>
                      <Badge variant="secondary">{estimatedSize}</Badge>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Revisar */}
                <TabsContent value="review" className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Revise su solicitud</h3>
                  
                  <div className="space-y-4">
                    {/* Resumen de la solicitud */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Formato:</span>
                        <Badge>{selectedFormat.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Período:</span>
                        <Badge variant="outline">{selectedScope.replace('-', ' ')}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Secciones seleccionadas:</span>
                        <Badge variant="secondary">
                          {Object.values(exportOptions).filter(Boolean).length} de {Object.keys(exportOptions).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tamaño estimado:</span>
                        <Badge variant="secondary">{estimatedSize}</Badge>
                      </div>
                    </div>

                    {/* Información legal */}
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Información Legal</AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <p className="text-sm">
                          Esta solicitud se realiza bajo sus derechos establecidos en:
                        </p>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          <li>HIPAA "Right of Access" (45 CFR 164.524)</li>
                          <li>Ley 26.529 Art. 14 - Derecho del paciente a obtener copia de su historia clínica</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Información de seguridad */}
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertTitle>Seguridad y Privacidad</AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <p className="text-sm">
                          Su información será:
                        </p>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          <li>Encriptada durante la transmisión y almacenamiento</li>
                          <li>Disponible para descarga durante 7 días</li>
                          <li>Eliminada automáticamente después del período de descarga</li>
                          <li>Registrada en el log de auditoría para cumplimiento</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Tiempo de procesamiento */}
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertTitle>Tiempo de Procesamiento</AlertTitle>
                      <AlertDescription>
                        <p className="text-sm">
                          La preparación de su información puede tomar entre 1-5 minutos dependiendo de la cantidad de datos.
                          Recibirá una notificación cuando esté lista para descargar.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Barra de progreso durante procesamiento */}
              {exportStatus === 'processing' && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Procesando su solicitud...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                  <p className="text-xs text-gray-600 text-center">
                    Por favor no cierre esta ventana
                  </p>
                </div>
              )}
            </>
          ) : exportStatus === 'completed' ? (
            // Estado completado
            <div className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">¡Exportación Completada!</h3>
                <p className="text-gray-600 mb-6">
                  Su información médica está lista para descargar
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Formato:</span>
                      <Badge variant="secondary">{selectedFormat.toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Válido hasta:</span>
                      <Badge variant="outline">
                        {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleDownload}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Descargar Archivo
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    size="lg"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                    <li>El enlace de descarga expirará en 7 días</li>
                    <li>Guarde el archivo en un lugar seguro</li>
                    <li>No comparta el enlace de descarga con terceros</li>
                    <li>Esta acción ha sido registrada en su historial de auditoría</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            // Estado de error
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error en la Exportación</h3>
              <p className="text-gray-600 mb-6">
                No se pudo completar la exportación de sus datos
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setExportStatus('idle');
                    setExportProgress(0);
                  }}
                  size="lg"
                >
                  Intentar Nuevamente
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>

        {exportStatus === 'idle' && (
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            {activeTab !== 'review' ? (
              <Button
                onClick={() => {
                  const tabs = ['format', 'scope', 'options', 'review'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={!canProceed()}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleExportRequest}
                disabled={isProcessing || !canProceed()}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Solicitar Exportación
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}