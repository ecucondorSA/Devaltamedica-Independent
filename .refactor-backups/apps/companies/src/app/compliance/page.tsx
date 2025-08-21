'use client';

import { BAAComplianceStatus } from '@/components/baa/BAAComplianceStatus';
import { BAAOnboarding } from '@/components/baa/BAAOnboarding';
import { useAuth  } from '@altamedica/auth';;
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@altamedica/ui';
import { Activity, ArrowLeft, FileText, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Página de Compliance y BAA
 * Gestiona el cumplimiento HIPAA y Business Associate Agreements
 */

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<'status' | 'onboarding'>('status');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Mock company info - en producción vendría del contexto de auth o API
  const companyInfo = {
    legalName: user?.companyName || 'Mi Empresa S.A.',
    tradeName: user?.companyName,
    taxId: '30-12345678-9',
    address: {
      street: 'Av. Principal 1234',
      city: 'Buenos Aires',
      state: 'CABA',
      zipCode: 'C1425',
      country: 'Argentina',
    },
    contactPerson: {
      name: user?.name || 'Representante Legal',
      title: 'CEO',
      email: user?.email || 'contact@empresa.com',
      phone: '+54 11 4000-0000',
    },
    entityType: 'business_associate' as const,
  };

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
    setActiveTab('onboarding');
  };

  const handleOnboardingComplete = (baaId: string) => {
    setShowOnboarding(false);
    setActiveTab('status');
    // Recargar para mostrar el nuevo estado
    window.location.reload();
  };

  const handleViewBAADetails = (baaId: string) => {
    // Navegar a página de detalles del BAA
    router.push(`/companies/compliance/baa/${baaId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Compliance y Cumplimiento HIPAA</h1>
            <p className="text-gray-600">
              Gestione sus acuerdos de asociado de negocio y cumplimiento normativo
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="status">
            <Activity className="h-4 w-4 mr-2" />
            Estado de Compliance
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            <FileText className="h-4 w-4 mr-2" />
            Proceso BAA
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="status">
            <BAAComplianceStatus
              companyId={user?.companyId || 'company-123'}
              onStartOnboarding={handleStartOnboarding}
              onViewDetails={handleViewBAADetails}
            />
          </TabsContent>

          <TabsContent value="onboarding">
            {showOnboarding ? (
              <BAAOnboarding
                companyId={user?.companyId || 'company-123'}
                companyInfo={companyInfo}
                onComplete={handleOnboardingComplete}
                onCancel={() => {
                  setShowOnboarding(false);
                  setActiveTab('status');
                }}
              />
            ) : (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Proceso de Onboarding BAA</h3>
                <p className="text-gray-600 mb-6">
                  Complete el proceso de Business Associate Agreement para cumplir con HIPAA
                </p>
                <Button onClick={handleStartOnboarding}>
                  <Shield className="h-4 w-4 mr-2" />
                  Iniciar Proceso
                </Button>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">¿Qué es un BAA?</h3>
          <p className="text-sm text-blue-800">
            Un Business Associate Agreement es un contrato legal requerido por HIPAA entre una
            entidad cubierta y un asociado de negocio que maneja PHI.
          </p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Beneficios del Compliance</h3>
          <p className="text-sm text-green-800">
            Cumplir con HIPAA protege a su organización de multas, mejora la confianza del cliente y
            garantiza el manejo seguro de datos médicos.
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">Soporte y Ayuda</h3>
          <p className="text-sm text-purple-800">
            ¿Necesita ayuda con el proceso? Nuestro equipo de compliance está disponible para
            asistirle en compliance@altamedica.com
          </p>
        </div>
      </div>
    </div>
  );
}
