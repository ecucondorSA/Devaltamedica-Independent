'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Progress,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@altamedica/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  FileText,
  Signature,
  Building,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Lock,
  ClipboardCheck,
  Info
} from 'lucide-react';
import { CompanyInfo, BAAObligations, BAA } from '@altamedica/types';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Componente de Onboarding de BAA
 * Guía a las empresas a través del proceso de aceptación del Business Associate Agreement
 */

interface BAAOnboardingProps {
  companyId: string;
  companyInfo: CompanyInfo;
  onComplete?: (baaId: string) => void;
  onCancel?: () => void;
}

type OnboardingStep = 
  | 'company_info'
  | 'review_terms'
  | 'accept_obligations'
  | 'sign_agreement'
  | 'verification'
  | 'complete';

interface OnboardingState {
  currentStep: OnboardingStep;
  onboardingId: string | null;
  baaId: string | null;
  baa: BAA | null;
  loading: boolean;
  error: string | null;
}

const STEP_CONFIG = {
  company_info: {
    title: 'Información de la Empresa',
    description: 'Verifique los datos de su empresa',
    icon: Building,
    progress: 20
  },
  review_terms: {
    title: 'Revisar Términos',
    description: 'Lea cuidadosamente el acuerdo de asociado de negocio',
    icon: FileText,
    progress: 40
  },
  accept_obligations: {
    title: 'Aceptar Obligaciones',
    description: 'Confirme el cumplimiento de las obligaciones HIPAA',
    icon: ClipboardCheck,
    progress: 60
  },
  sign_agreement: {
    title: 'Firmar Acuerdo',
    description: 'Firme digitalmente el BAA',
    icon: Signature,
    progress: 80
  },
  verification: {
    title: 'Verificación',
    description: 'Confirmando el acuerdo',
    icon: Shield,
    progress: 90
  },
  complete: {
    title: 'Completado',
    description: 'BAA activo y operativo',
    icon: CheckCircle,
    progress: 100
  }
};

export function BAAOnboarding({
  companyId,
  companyInfo,
  onComplete,
  onCancel
}: BAAOnboardingProps) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'company_info',
    onboardingId: null,
    baaId: null,
    baa: null,
    loading: false,
    error: null
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedObligations, setAcceptedObligations] = useState({
    safeguards: false,
    breaches: false,
    usePermitted: false,
    audits: false,
    termination: false
  });

  // Función simple para mostrar mensajes (reemplaza toast)
  const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
    logger.info(`[${type.toUpperCase()}] ${message}`);
    // TODO: Implementar notificación visual sin toast
  };

  // Verificar estado existente de onboarding
  useEffect(() => {
    checkExistingOnboarding();
  }, []);

  const checkExistingOnboarding = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/v1/baa/onboarding?companyId=${companyId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data.onboardingStatus === 'completed' && data.data.currentBAA) {
          setState(prev => ({
            ...prev,
            currentStep: 'complete',
            baa: data.data.currentBAA,
            baaId: data.data.currentBAA.id,
            loading: false
          }));
        } else if (data.data.onboardingStatus === 'in_progress') {
          // Continuar desde donde se quedó
          setState(prev => ({
            ...prev,
            baa: data.data.currentBAA,
            baaId: data.data.currentBAA?.id,
            loading: false
          }));
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    } catch (error) {
      logger.error('Error checking onboarding:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: 'Error al verificar el estado del onboarding'
      }));
    }
  };

  // Iniciar onboarding
  const startOnboarding = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/v1/baa/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyId,
          companyInfo
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState(prev => ({
          ...prev,
          onboardingId: data.data.onboardingId,
          baaId: data.data.baaId,
          currentStep: data.data.nextStep as OnboardingStep,
          loading: false
        }));

        // Cargar el BAA creado
        await loadBAA(data.data.baaId);

        showMessage('Proceso iniciado: Comenzando proceso de onboarding BAA', 'success');
      } else {
        throw new Error(data.error || 'Error al iniciar onboarding');
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message
      }));
      
      showMessage(`Error: ${error.message}`, 'error');
    }
  };

  // Cargar BAA
  const loadBAA = async (baaId: string) => {
    try {
      const response = await fetch(`/api/v1/baa/${baaId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          baa: data.data.baa
        }));
      }
    } catch (error) {
      logger.error('Error loading BAA:', error);
    }
  };

  // Avanzar al siguiente paso
  const progressStep = async (stepData: any = {}) => {
    if (!state.onboardingId) {
      await startOnboarding();
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/v1/baa/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          onboardingId: state.onboardingId,
          currentStep: state.currentStep,
          stepData
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data.completed) {
          setState(prev => ({
            ...prev,
            currentStep: 'complete',
            loading: false
          }));

          showMessage('¡Proceso completado! El BAA ha sido activado exitosamente', 'success');

          if (onComplete && data.data.baaId) {
            onComplete(data.data.baaId);
          }
        } else {
          setState(prev => ({
            ...prev,
            currentStep: data.data.nextStep as OnboardingStep,
            loading: false
          }));
        }
      } else {
        throw new Error(data.error || 'Error al procesar paso');
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message
      }));
      
      showMessage(`Error: ${error.message}`, 'error');
    }
  };

  // Firmar BAA
  const signBAA = async () => {
    if (!state.baaId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/v1/baa/${state.baaId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          signatureData: `${companyInfo.legalName}_${Date.now()}`,
          signatureMethod: 'electronic'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState(prev => ({
          ...prev,
          baa: data.data.baa,
          loading: false
        }));

        // Avanzar al siguiente paso
        await progressStep({ signature: data.data.baa.businessAssociateSignature });

        showMessage('Acuerdo firmado: El BAA ha sido firmado exitosamente', 'success');
      } else {
        throw new Error(data.error || 'Error al firmar BAA');
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message
      }));
      
      showMessage(`Error: ${error.message}`, 'error');
    }
  };

  // Descargar BAA
  const downloadBAA = () => {
    if (!state.baa) return;

    // Crear contenido del BAA para descargar
    const content = `
BUSINESS ASSOCIATE AGREEMENT
=============================

Fecha: ${new Date().toLocaleDateString()}
ID del Acuerdo: ${state.baa.id}

PARTES:
- Entidad Cubierta: ${state.baa.coveredEntityInfo.legalName}
- Asociado de Negocio: ${state.baa.businessAssociateInfo.legalName}

ESTADO: ${state.baa.status}

OBLIGACIONES ACEPTADAS:
${JSON.stringify(state.baa.obligations, null, 2)}

FIRMAS:
- Entidad Cubierta: ${state.baa.coveredEntitySignature ? 'Firmado' : 'Pendiente'}
- Asociado de Negocio: ${state.baa.businessAssociateSignature ? 'Firmado' : 'Pendiente'}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAA_${state.baa.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Verificar si puede avanzar al siguiente paso
  const canProceed = () => {
    switch (state.currentStep) {
      case 'company_info':
        return true;
      case 'review_terms':
        return acceptedTerms;
      case 'accept_obligations':
        return Object.values(acceptedObligations).every(v => v === true);
      case 'sign_agreement':
        return true;
      default:
        return false;
    }
  };

  // Renderizar contenido del paso actual
  const renderStepContent = () => {
    const stepConfig = STEP_CONFIG[state.currentStep];
    const StepIcon = stepConfig.icon;

    switch (state.currentStep) {
      case 'company_info':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{stepConfig.title}</h3>
                <p className="text-sm text-gray-600">{stepConfig.description}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Datos de la Empresa</CardTitle>
                <CardDescription>
                  Verifique que la información sea correcta antes de continuar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Razón Social</Label>
                    <p className="font-medium">{companyInfo.legalName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">CUIT</Label>
                    <p className="font-medium">{companyInfo.taxId}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Tipo de Entidad</Label>
                    <p className="font-medium">{companyInfo.entityType}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Email de Contacto</Label>
                    <p className="font-medium">{companyInfo.contactPerson.email}</p>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Esta información será utilizada en el acuerdo legal. 
                    Si necesita actualizar algún dato, contacte al administrador.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        );

      case 'review_terms':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{stepConfig.title}</h3>
                <p className="text-sm text-gray-600">{stepConfig.description}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Acuerdo de Asociado de Negocio (BAA)</CardTitle>
                <CardDescription>
                  Lea cuidadosamente todos los términos y condiciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="prose prose-sm max-w-none">
                    <h2>ACUERDO DE ASOCIADO DE NEGOCIO</h2>
                    
                    <p>
                      Este Acuerdo de Asociado de Negocio (&quot;Acuerdo&quot;) se celebra entre 
                      <strong> AltaMedica Platform S.A.</strong> (&quot;Entidad Cubierta&quot;) y 
                      <strong> {companyInfo.legalName}</strong> (&quot;Asociado de Negocio&quot;).
                    </p>

                    <h3>1. OBLIGACIONES DEL ASOCIADO DE NEGOCIO</h3>
                    
                    <h4>1.1 Salvaguardas</h4>
                    <p>
                      El Asociado de Negocio acuerda implementar salvaguardas administrativas, 
                      físicas y técnicas apropiadas para proteger la confidencialidad, integridad 
                      y disponibilidad de la Información de Salud Protegida (PHI).
                    </p>

                    <h4>1.2 Notificación de Brechas</h4>
                    <p>
                      El Asociado de Negocio notificará a la Entidad Cubierta dentro de 60 días 
                      sobre cualquier uso o divulgación no autorizada de PHI de la cual tenga conocimiento.
                    </p>

                    <h4>1.3 Uso Permitido</h4>
                    <p>
                      El Asociado de Negocio usará y divulgará PHI solo según lo permitido por 
                      este Acuerdo y la ley aplicable.
                    </p>

                    <h4>1.4 Subcontratistas</h4>
                    <p>
                      El Asociado de Negocio no divulgará PHI a subcontratistas sin un acuerdo 
                      por escrito que contenga las mismas restricciones y condiciones que se 
                      aplican al Asociado de Negocio.
                    </p>

                    <h3>2. TÉRMINO Y TERMINACIÓN</h3>

                    <h4>2.1 Vigencia</h4>
                    <p>
                      Este Acuerdo entrará en vigor en la fecha de firma y continuará hasta 
                      su terminación según lo establecido en este documento.
                    </p>

                    <h4>2.2 Terminación</h4>
                    <p>
                      Cualquier parte puede terminar este Acuerdo con 30 días de aviso por escrito 
                      a la otra parte.
                    </p>

                    <h4>2.3 Efecto de la Terminación</h4>
                    <p>
                      Al terminar este Acuerdo, el Asociado de Negocio devolverá o destruirá 
                      toda la PHI recibida de la Entidad Cubierta.
                    </p>

                    <h3>3. CUMPLIMIENTO NORMATIVO</h3>
                    <p>Este Acuerdo cumple con:</p>
                    <ul>
                      <li>Ley 26.529 (Argentina) - Derechos del Paciente</li>
                      <li>Ley 25.326 - Protección de Datos Personales</li>
                      <li>Estándares HIPAA adaptados al contexto argentino</li>
                    </ul>

                    <h3>4. INDEMNIZACIÓN</h3>
                    <p>
                      El Asociado de Negocio indemnizará y mantendrá indemne a la Entidad 
                      Cubierta de cualquier pérdida resultante del incumplimiento de este Acuerdo.
                    </p>

                    <h3>5. LEY APLICABLE</h3>
                    <p>
                      Este Acuerdo se regirá por las leyes de la República Argentina.
                    </p>
                  </div>
                </ScrollArea>

                <div className="flex items-center space-x-2 mt-6">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <Label 
                    htmlFor="accept-terms" 
                    className="cursor-pointer"
                  >
                    He leído y entiendo los términos del Acuerdo de Asociado de Negocio
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'accept_obligations':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{stepConfig.title}</h3>
                <p className="text-sm text-gray-600">{stepConfig.description}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Confirmación de Obligaciones</CardTitle>
                <CardDescription>
                  Confirme que su organización cumple con las siguientes obligaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Al aceptar estas obligaciones, su empresa se compromete a cumplir 
                    con los estándares de seguridad y privacidad requeridos.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="safeguards"
                      checked={acceptedObligations.safeguards}
                      onCheckedChange={(checked) => 
                        setAcceptedObligations(prev => ({
                          ...prev,
                          safeguards: checked as boolean
                        }))
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="safeguards" className="cursor-pointer">
                        Implementación de Salvaguardas
                      </Label>
                      <p className="text-sm text-gray-600">
                        Implementaremos salvaguardas administrativas, físicas y técnicas 
                        para proteger la PHI.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="breaches"
                      checked={acceptedObligations.breaches}
                      onCheckedChange={(checked) => 
                        setAcceptedObligations(prev => ({
                          ...prev,
                          breaches: checked as boolean
                        }))
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="breaches" className="cursor-pointer">
                        Notificación de Brechas
                      </Label>
                      <p className="text-sm text-gray-600">
                        Notificaremos cualquier brecha de seguridad dentro de 60 días.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="use-permitted"
                      checked={acceptedObligations.usePermitted}
                      onCheckedChange={(checked) => 
                        setAcceptedObligations(prev => ({
                          ...prev,
                          usePermitted: checked as boolean
                        }))
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="use-permitted" className="cursor-pointer">
                        Uso Permitido de PHI
                      </Label>
                      <p className="text-sm text-gray-600">
                        Usaremos la PHI solo según lo permitido por el acuerdo y la ley.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="audits"
                      checked={acceptedObligations.audits}
                      onCheckedChange={(checked) => 
                        setAcceptedObligations(prev => ({
                          ...prev,
                          audits: checked as boolean
                        }))
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="audits" className="cursor-pointer">
                        Permitir Auditorías
                      </Label>
                      <p className="text-sm text-gray-600">
                        Permitiremos auditorías anuales de cumplimiento.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="termination"
                      checked={acceptedObligations.termination}
                      onCheckedChange={(checked) => 
                        setAcceptedObligations(prev => ({
                          ...prev,
                          termination: checked as boolean
                        }))
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="termination" className="cursor-pointer">
                        Devolución/Destrucción de PHI
                      </Label>
                      <p className="text-sm text-gray-600">
                        Al terminar el acuerdo, devolveremos o destruiremos toda la PHI.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'sign_agreement':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{stepConfig.title}</h3>
                <p className="text-sm text-gray-600">{stepConfig.description}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Firma Digital del Acuerdo</CardTitle>
                <CardDescription>
                  Firme electrónicamente el BAA para activarlo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Se requiere autenticación de dos factores (MFA) para firmar este documento.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Firmante</Label>
                    <p className="font-medium">{companyInfo.contactPerson.name}</p>
                    <p className="text-sm text-gray-600">{companyInfo.contactPerson.title}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Empresa</Label>
                    <p className="font-medium">{companyInfo.legalName}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Fecha y Hora</Label>
                    <p className="font-medium">{new Date().toLocaleString()}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Método de Firma</Label>
                    <Badge>Firma Electrónica</Badge>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Declaración de Firma:</strong> Al hacer clic en &quot;Firmar Acuerdo&quot;, 
                    confirmo que tengo autoridad para vincular legalmente a {companyInfo.legalName} 
                    a este Acuerdo de Asociado de Negocio y acepto todos sus términos y condiciones.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={signBAA}
                    disabled={state.loading}
                    className="flex-1"
                  >
                    {state.loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Firmando...
                      </>
                    ) : (
                      <>
                        <Signature className="h-4 w-4 mr-2" />
                        Firmar Acuerdo
                      </>
                    )}
                  </Button>

                  {state.baa && (
                    <Button
                      variant="outline"
                      onClick={downloadBAA}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Borrador
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-yellow-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Verificando Acuerdo</h3>
                <p className="text-sm text-gray-600">Procesando firma y activando BAA</p>
              </div>
            </div>

            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                  <p className="text-lg">Verificando firma digital...</p>
                  <p className="text-sm text-gray-600">
                    Este proceso puede tomar unos momentos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">¡Proceso Completado!</h3>
                <p className="text-sm text-gray-600">El BAA está activo y operativo</p>
              </div>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Su Acuerdo de Asociado de Negocio ha sido activado exitosamente. 
                Ahora puede operar en la plataforma AltaMedica con pleno cumplimiento HIPAA.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Detalles del Acuerdo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.baa && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">ID del Acuerdo</Label>
                        <p className="font-mono text-sm">{state.baa.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Estado</Label>
                        <Badge variant="outline" className="bg-green-50">
                          {state.baa.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Fecha de Vigencia</Label>
                        <p className="text-sm">
                          {new Date(state.baa.version.effectiveDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Próxima Revisión</Label>
                        <p className="text-sm">
                          {state.baa.nextReviewDate 
                            ? new Date(state.baa.nextReviewDate).toLocaleDateString()
                            : 'En 12 meses'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={downloadBAA} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Acuerdo Firmado
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = '/companies/compliance'}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Panel de Compliance
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Próximos Pasos</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Configure los permisos de acceso para su equipo</li>
                <li>• Revise las políticas de seguridad de datos</li>
                <li>• Complete la capacitación HIPAA obligatoria</li>
                <li>• Configure las notificaciones de compliance</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Business Associate Agreement (BAA)
        </h1>
        <p className="text-gray-600">
          Complete el proceso de onboarding para cumplir con los requisitos HIPAA
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={STEP_CONFIG[state.currentStep].progress} className="h-2" />
        <div className="flex justify-between mt-2">
          {Object.entries(STEP_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isCompleted = config.progress < STEP_CONFIG[state.currentStep].progress;
            const isCurrent = key === state.currentStep;
            
            return (
              <div
                key={key}
                className={`flex flex-col items-center ${
                  isCompleted ? 'text-green-600' : 
                  isCurrent ? 'text-blue-600' : 
                  'text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1 hidden sm:block">{config.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      {renderStepContent()}

      {/* Action Buttons */}
      {state.currentStep !== 'complete' && state.currentStep !== 'verification' && (
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={state.loading}
          >
            Cancelar
          </Button>

          {state.currentStep !== 'sign_agreement' && (
            <Button
              onClick={() => progressStep()}
              disabled={!canProceed() || state.loading}
            >
              {state.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  Continuar
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}