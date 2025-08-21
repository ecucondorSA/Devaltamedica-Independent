'use client';

import { useAuth } from '@altamedica/auth/client';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

interface ForgotPasswordState {
  email: string;
  isLoading: boolean;
  error: string;
  success: boolean;
  emailSent: boolean;
}

const ForgotPasswordForm: React.FC = () => {
  const { resetPassword } = useAuth();
  const [state, setState] = useState<ForgotPasswordState>({
    email: '',
    isLoading: false,
    error: '',
    success: false,
    emailSent: false,
  });

  const updateState = (updates: Partial<ForgotPasswordState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(state.email)) {
      updateState({ error: 'Por favor ingresa un email válido' });
      return;
    }

    updateState({ isLoading: true, error: '' });

    try {
      await resetPassword(state.email);
      updateState({
        success: true,
        emailSent: true,
        isLoading: false,
      });
    } catch (error: any) {
      let errorMessage = 'Error al enviar el email de recuperación';

      // El contexto ya maneja los errores específicos
      if (error.message) {
        errorMessage = error.message;
      }

      updateState({ error: errorMessage, isLoading: false });
    }
  };

  // Pantalla de éxito
  if (state.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">¡Email Enviado!</h2>
              <p className="text-neutral-600">Hemos enviado las instrucciones de recuperación a:</p>
              <p className="text-primary-500 font-medium mt-1">{state.email}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-primary-600">
                  <p className="font-medium mb-1">¿No recibiste el email?</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Revisa tu carpeta de spam</li>
                    <li>• Verifica que el email esté correcto</li>
                    <li>• Espera unos minutos y revisa nuevamente</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => updateState({ success: false, email: '', error: '' })}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                Reenviar Email
              </button>

              <Link
                href="/login"
                className="w-full border-2 border-blue-300 text-primary-500 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver al Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50">
      <div className="flex min-h-screen">
        {/* Mitad Izquierda - Información */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-600 p-12 items-center justify-center">
          <div className="max-w-lg text-white">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">🏥 AltaMedica</h1>
              <h2 className="text-2xl font-semibold mb-6">Recuperación Segura</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Proceso Seguro</h3>
                  <p className="text-primary-100">
                    Utilizamos encriptación de nivel médico para proteger tu información personal y
                    clínica.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Acceso Rápido</h3>
                  <p className="text-primary-100">
                    Recupera tu acceso en minutos y vuelve a gestionar tu salud sin interrupciones.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Soporte 24/7</h3>
                  <p className="text-primary-100">
                    Nuestro equipo médico-técnico está disponible para ayudarte en cualquier
                    momento.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-primary-100 italic">
                "La seguridad de tus datos médicos es nuestra prioridad. Cada proceso está diseñado
                cumpliendo estándares internacionales de protección sanitaria."
              </p>
              <div className="mt-4 text-sm font-medium">- Equipo de Seguridad AltaMedica</div>
            </div>
          </div>
        </div>

        {/* Mitad Derecha - Funcionalidad */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Recuperar Contraseña</h2>
                <p className="text-neutral-600">
                  Ingresa tu email y te enviaremos las instrucciones para restablecer tu contraseña
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <p className="text-red-600 text-sm">{state.error}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-neutral-700 mb-2"
                  >
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={state.email}
                      onChange={(e) =>
                        updateState({
                          email: e.target.value,
                          error: '',
                        })
                      }
                      className="w-full py-3 px-4 pl-12 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="tu@email.com"
                      required
                      disabled={state.isLoading}
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  </div>
                  {state.email && !validateEmail(state.email) && (
                    <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Email inválido</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={state.isLoading || !validateEmail(state.email)}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {state.isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Instrucciones</span>
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-primary-500 hover:text-primary-600 font-medium flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver al Login</span>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
export { ForgotPasswordForm };
