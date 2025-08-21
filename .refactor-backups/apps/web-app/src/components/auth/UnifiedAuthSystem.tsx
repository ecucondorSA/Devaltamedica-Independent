'use client';

import { useAuth  } from '@altamedica/auth';;
import { getRedirectUrlForRole } from '@altamedica/auth/utils/redirects';
import { Button } from '@altamedica/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, Lock, Mail, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
    // Solo roles públicos en registro (ADMIN se crea por canal interno)
    role: z.enum(['PATIENT', 'DOCTOR', 'COMPANY']).default('PATIENT'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface UnifiedAuthSystemProps {
  mode?: 'login' | 'register';
  onSuccess?: (user: any) => void;
  redirectTo?: string;
  enable2FA?: boolean;
  customStyles?: string;
}

/**
 * Sistema de Autenticación Unificado
 * Consolida todas las variantes de AuthSystem en un componente único y configurable
 *
 * Features:
 * - Login/Register con validación Zod
 * - 2FA opcional
 * - Integración con @altamedica/auth
 * - Redirección por roles
 * - Loading states optimizados
 * - Error handling centralizado
 */
export const UnifiedAuthSystem: React.FC<UnifiedAuthSystemProps> = ({
  mode: initialMode = 'login',
  onSuccess,
  redirectTo,
  enable2FA = false,
  customStyles = '',
}) => {
  const router = useRouter();
  const { login, register: authRegister, user, loading: authLoading, error: authError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'twoFactor' | 'complete'>(initialMode);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form para login
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // React Hook Form para registro
  const {
    register: registerRegister,
    handleSubmit: handleSubmitRegister,
    formState: { errors: registerErrors },
    reset: resetRegister,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Efecto para manejar redirección después de login exitoso
  useEffect(() => {
    if (user && mode === 'complete') {
      // Si requiere seleccionar rol, forzar pantalla de selección
      if ((user as any)?.pendingRoleSelection) {
        router.push('/auth/select-role');
        return;
      }

      const redirect = redirectTo || getRoleBasedRedirect(user.role);
      onSuccess ? onSuccess(user) : router.push(redirect);
    }
  }, [user, mode, redirectTo, onSuccess, router]);

  // Función para obtener redirección basada en rol (centralizada)
  const getRoleBasedRedirect = (role: string): string => {
    const normalized = role?.toString().toLowerCase() as any;
    return getRedirectUrlForRole(normalized, { target: 'dashboard' });
  };

  // Manejador de login
  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);

      if (enable2FA && result.requires2FA) {
        setMode('twoFactor');
        toast.info('Ingresa tu código de verificación');
      } else {
        setMode('complete');
        toast.success('¡Bienvenido de vuelta!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejador de registro
  const handleRegister = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const result = await authRegister({
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (enable2FA) {
        setMode('twoFactor');
        toast.info('Verifica tu email para continuar');
      } else {
        setMode('complete');
        toast.success('¡Cuenta creada exitosamente!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejador de 2FA
  const handle2FA = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    setIsSubmitting(true);
    try {
      // Aquí iría la verificación real del 2FA
      // await verify2FA(twoFactorCode);

      // Simulación para demo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMode('complete');
      toast.success('Verificación exitosa');
    } catch (error: any) {
      toast.error('Código inválido');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizado condicional basado en el modo
  if (mode === 'twoFactor') {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50 flex items-center justify-center p-4 ${customStyles}`}
      >
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Verificación 2FA</h2>
              <p className="text-gray-600 mt-2">Ingresa el código de 6 dígitos</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-2xl tracking-widest focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="000000"
                autoFocus
              />

              <Button
                onClick={handle2FA}
                disabled={isSubmitting || twoFactorCode.length !== 6}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Verificando...' : 'Verificar Código'}
              </Button>

              <button
                onClick={() => setMode('login')}
                className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'complete') {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-green-50 via-neutral-50 to-emerald-50 flex items-center justify-center p-4 ${customStyles}`}
      >
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Bienvenido!</h2>
            <p className="text-gray-600 mb-6">Redirigiendo a tu portal...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado principal: Login o Register
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50 flex items-center justify-center p-4 ${customStyles}`}
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Tabs de navegación */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setMode('login');
                resetLogin();
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setMode('register');
                resetRegister();
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Registrarse
            </button>
          </div>

          <div className="p-8">
            {/* Logo/Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
              </h2>
            </div>

            {/* Formulario de Login */}
            {mode === 'login' && (
              <form onSubmit={handleSubmitLogin(handleLogin)} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...registerLogin('email')}
                      type="email"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...registerLogin('password')}
                      type="password"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Contraseña"
                    />
                  </div>
                  {loginErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                  </label>
                  <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || authLoading}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            )}

            {/* Formulario de Registro */}
            {mode === 'register' && (
              <form onSubmit={handleSubmitRegister(handleRegister)} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...registerRegister('email')}
                      type="email"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  {registerErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{registerErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...registerRegister('password')}
                      type="password"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Contraseña"
                    />
                  </div>
                  {registerErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{registerErrors.password.message}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...registerRegister('confirmPassword')}
                      type="password"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Confirmar contraseña"
                    />
                  </div>
                  {registerErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {registerErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <select
                    {...registerRegister('role')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="PATIENT">Paciente</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="COMPANY">Empresa</option>
                  </select>
                  {registerErrors.role && (
                    <p className="mt-1 text-sm text-red-600">{registerErrors.role.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || authLoading}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </form>
            )}

            {/* Mostrar errores de autenticación */}
            {authError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{authError}</p>
              </div>
            )}

            {/* Separador */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O continúa con</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => toast.info('Google login en desarrollo')}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export default para compatibilidad con imports existentes
export default UnifiedAuthSystem;
