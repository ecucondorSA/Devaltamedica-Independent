'use client';

import { useAuth } from '@altamedica/auth/client';
import { auth, sendVerificationEmail } from '@altamedica/firebase';
import { applyActionCode } from 'firebase/auth';
import { AlertCircle, ArrowRight, CheckCircle, Loader2, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { logger } from '@altamedica/shared/services/logger.service';
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>(
    'pending',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Verificar si hay parámetros de verificación en la URL
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const continueUrl = searchParams.get('continueUrl');

  useEffect(() => {
    // Si hay parámetros de verificación, procesar automáticamente
    if (mode === 'verifyEmail' && oobCode) {
      handleEmailVerification(oobCode);
    }
  }, [mode, oobCode]);

  const handleEmailVerification = async (code: string) => {
    setIsVerifying(true);
    logger.info('📧 [VerifyEmail] Iniciando verificación con código:', code);

    try {
      // Verificar el email usando Firebase Auth
      logger.info('🔥 [VerifyEmail] Aplicando código de verificación...');
      await applyActionCode(auth, code);
      logger.info('✅ [VerifyEmail] Email verificado exitosamente');

      setVerificationStatus('success');
      toast.success('¡Email verificado exitosamente!');
    } catch (error: any) {
      logger.error('❌ [VerifyEmail] Error verificando email:', error);
      setVerificationStatus('error');

      let errorMessage = 'Error al verificar el email';
      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage = 'El enlace de verificación ha expirado';
          break;
        case 'auth/invalid-action-code':
          errorMessage = 'El enlace de verificación es inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'La cuenta está deshabilitada';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No se encontró la cuenta';
          break;
        default:
          errorMessage = error.message || 'Error desconocido al verificar email';
      }

      setErrorMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user || !auth.currentUser) {
      toast.error('No hay usuario autenticado');
      return;
    }

    setIsResending(true);
    logger.info(
      '📤 [VerifyEmail] Reenviando email de verificación para:',
      auth.currentUser?.email || user.email,
    );

    try {
      // Reenviar email de verificación usando Firebase Auth
      await sendVerificationEmail(auth.currentUser);
      logger.info('✅ [VerifyEmail] Email de verificación reenviado exitosamente');
      toast.success('Email de verificación reenviado. Revisa tu bandeja de entrada.');
      setErrorMessage(''); // Limpiar errores previos
    } catch (error: any) {
      logger.error('❌ [VerifyEmail] Error reenviando email:', error);
      const errorMessage = error.message || 'Error al reenviar email de verificación';
      setErrorMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Si está verificando automáticamente
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verificando Email</h2>
            <p className="text-gray-600 mb-6">
              Estamos procesando tu verificación de email. Este proceso puede tomar unos segundos...
            </p>

            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si la verificación fue exitosa
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Email Verificado!</h2>
            <p className="text-gray-600 mb-6">
              Tu dirección de email ha sido verificada exitosamente. Ya puedes acceder a todas las
              funcionalidades de AltaMedica.
            </p>

            <div className="space-y-4">
              <Link
                href="/login"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Iniciar Sesión</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                ✅ Verificación Completada
              </h3>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Acceso completo a tu cuenta médica</li>
                <li>• Notificaciones por email habilitadas</li>
                <li>• Todas las funciones desbloqueadas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si hay error en la verificación
  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error de Verificación</h2>
            <p className="text-gray-600 mb-2">
              No pudimos verificar tu email. Esto puede deberse a:
            </p>

            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
              <ul className="text-sm text-red-700 space-y-1 text-left">
                <li>• El enlace ha expirado</li>
                <li>• El enlace ya fue usado</li>
                <li>• El enlace es inválido</li>
              </ul>
            </div>

            {errorMessage && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResending || !user}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Reenviando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Reenviar Email de Verificación</span>
                  </>
                )}
              </button>

              <Link
                href="/login"
                className="w-full border-2 border-blue-300 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center"
              >
                Volver al Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista por defecto (cuando no hay parámetros de verificación)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50">
      <div className="flex min-h-screen">
        {/* Mitad Izquierda - Información */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-600 p-12 items-center justify-center">
          <div className="max-w-lg text-white">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">🏥 AltaMedica</h1>
              <h2 className="text-2xl font-semibold mb-6">Verificación de Email</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Email Seguro</h3>
                  <p className="text-blue-100">
                    La verificación por email asegura que solo tú puedas acceder a tu información
                    médica personal.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Activación Completa</h3>
                  <p className="text-blue-100">
                    Una vez verificado, tendrás acceso completo a citas, historiales médicos y todas
                    las funcionalidades.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Protección HIPAA</h3>
                  <p className="text-blue-100">
                    Tu email verificado nos permite enviarte notificaciones médicas cumpliendo
                    regulaciones de privacidad.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-blue-100 italic">
                "La verificación por email es un paso crucial para mantener la seguridad de tu
                información médica y garantizar comunicaciones confiables."
              </p>
              <div className="mt-4 text-sm font-medium">- Equipo de Seguridad AltaMedica</div>
            </div>
          </div>
        </div>

        {/* Mitad Derecha - Instrucciones */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifica tu Email</h2>
              <p className="text-gray-600 mb-6">
                Hemos enviado un enlace de verificación a tu email. Haz clic en el enlace para
                activar tu cuenta.
              </p>

              <div className="space-y-4 mb-8">
                {user && (
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Reenviando...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Reenviar Email</span>
                      </>
                    )}
                  </button>
                )}

                <Link
                  href="/login"
                  className="w-full border-2 border-blue-300 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center"
                >
                  Volver al Login
                </Link>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">
                  📧 ¿No recibes el email?
                </h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Revisa tu carpeta de spam</li>
                  <li>• Verifica que el email sea correcto</li>
                  <li>• Espera hasta 10 minutos</li>
                  <li>• Usa el botón "Reenviar Email"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
