/**
 * 🏥 ALTA - Página de Anamnesis con IA
 * Asistente Médica desarrollada por Dr. Eduardo Marques (Medicina-UBA)
 */

'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { AltaChat } from '@altamedica/alta-agent';
import { useAuth } from '@altamedica/auth';
import { ArrowLeft, CheckCircle, Heart, Info, Shield, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { logger } from '@altamedica/shared';
export default function AltaAnamnesisPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [aiCapabilities, setAiCapabilities] = useState<{
    manus: boolean;
    genSpark: boolean;
    features: string[];
  } | null>(null);

  const handleSessionComplete = async (summary: string) => {
    logger.info('Anamnesis completada:', summary);

    // Guardar el resumen en la base de datos
    try {
      const response = await fetch('/api/v1/anamnesis/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: (user as any)?.id || '',
          summary: JSON.parse(summary),
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Redirigir al dashboard con mensaje de éxito
        router.push('/dashboard?anamnesis=completed');
      }
    } catch (error) {
      logger.error('Error guardando anamnesis:', error as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-xl font-bold text-gray-900">Anamnesis Médica con Alta</h1>
                <p className="text-sm text-gray-500">Historia clínica conversacional</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-1 text-green-500" />
                <span>HIPAA Compliant</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Heart className="w-4 h-4 mr-1 text-red-500" />
                <span>100% Confidencial</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>Alta</strong> es tu asistente médica virtual desarrollada por el Dr. Eduardo
              Marques (UBA). Te guiará a través de tu historia clínica de forma conversacional y
              empática. Podés hablar o escribir, y Alta detectará automáticamente cualquier urgencia
              médica.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <AltaChat
            patientId={user?.id || 'guest'}
            onSessionComplete={handleSessionComplete}
            enableVoice={true}
            enableAvatar={true}
            height="calc(100vh - 280px)"
            className="border-0"
          />
        </div>

        {/* AI Capabilities Indicator */}
        {aiCapabilities && (aiCapabilities.manus || aiCapabilities.genSpark) && (
          <div className="mt-6 mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Capacidades de IA Activas</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {aiCapabilities.manus && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Manus: Razonamiento Médico</span>
                </div>
              )}
              {aiCapabilities.genSpark && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">GenSpark: Generación Dinámica</span>
                </div>
              )}
            </div>
            {aiCapabilities.features.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                  Ver {aiCapabilities.features.length} funciones mejoradas
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {aiCapabilities.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Conversación Natural</h3>
            </div>
            <p className="text-sm text-gray-600">
              Hablá con Alta como lo harías con un médico real. Usa tu voz o escribí, como
              prefieras.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Detección de Urgencias</h3>
            </div>
            <p className="text-sm text-gray-600">
              Alta identifica automáticamente síntomas de urgencia y te alerta si necesitás atención
              inmediata.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Historia Completa</h3>
            </div>
            <p className="text-sm text-gray-600">
              Alta te guía por todos los aspectos importantes de tu historia médica siguiendo
              protocolos profesionales.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Alta fue desarrollada por el <strong>Dr. Eduardo Marques</strong> (Medicina-UBA)
            siguiendo los protocolos de Semiología Médica de Álvarez.
          </p>
          <p className="mt-2">
            Tu información es completamente confidencial y cumple con los estándares HIPAA de
            privacidad médica.
          </p>
        </div>
      </main>
    </div>
  );
}
