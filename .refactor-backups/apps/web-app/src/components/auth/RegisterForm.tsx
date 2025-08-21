'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { PublicUserRole, type RegisterData, useAuth  } from '@altamedica/auth';;
import {
  ArrowRight,
  Building,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  Mail,
  Shield,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDashboardUrl } from '../../config/app-urls';

import { logger } from '@altamedica/shared/services/logger.service';
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: PublicUserRole; // Usar solo roles públicos (sin admin)
  first_name: string;
  last_name: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: PublicUserRole.PATIENT, // Usar enum en lugar de string
    first_name: '',
    last_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();
  const { user, signUp, loginWithGoogle, isLoading, error } = useAuth();

  // Redirigir si ya está autenticado (solo al cargar la página)
  useEffect(() => {
    if (user && !isLoading && !isSubmitting) {
      const role = user.role as any;
      const dashboardUrl = role === 'patient' ? '/dashboard' : getDashboardUrl(role);
      if (dashboardUrl.startsWith('http')) {
        window.location.href = dashboardUrl;
      } else {
        router.push(dashboardUrl);
      }
    }
  }, [user, isLoading, isSubmitting, router]);

  const validateForm = () => {
    setLocalError('');

    const { email, password, confirmPassword, first_name, last_name } = formData;

    if (!email || !password || !first_name || !last_name) {
      setLocalError('Todos los campos marcados con * son requeridos');
      return false;
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return false;
    }

    if (password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Email inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setLocalError('');

    try {
      const registerData: RegisterData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.first_name,
        lastName: formData.last_name,
        role: formData.role,
        displayName: `${formData.first_name} ${formData.last_name}`,
      };

      logger.info('📝 [RegisterForm] Llamando a signUp con datos:', {
        email: registerData.email,
        role: registerData.role,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        displayName: registerData.displayName,
      });

      await signUp(registerData);
      setSuccess('¡Registro exitoso! Revisa tu email para verificar tu cuenta.');

      // Redirigir según el rol seleccionado (login de su app)
      logger.info('🎭 [RegisterForm] Rol seleccionado:', formData.role);
      setTimeout(() => {
        const base =
          formData.role === PublicUserRole.DOCTOR
            ? 'http://localhost:3002'
            : formData.role === PublicUserRole.COMPANY
              ? 'http://localhost:3004'
              : 'http://localhost:3003';
        window.location.href = `${base}/auth/login`;
      }, 1500);
    } catch (error) {
      // El error ya se muestra con toast desde el contexto
      setLocalError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    setLocalError('');

    try {
      await loginWithGoogle();
      setSuccess('¡Registro con Google exitoso!');

      // No es necesario redirigir manualmente, el useEffect lo manejará
    } catch (error) {
      // El error ya se muestra con toast desde el contexto
      setLocalError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (localError) setLocalError('');
  };

  const getRoleInfo = (role: PublicUserRole) => {
    switch (role) {
      case PublicUserRole.PATIENT:
        return {
          icon: <User className="h-4 w-4" />,
          label: 'Paciente',
          description: 'Accede a consultas médicas y gestiona tu salud',
        };
      case PublicUserRole.DOCTOR:
        return {
          icon: <UserCheck className="h-4 w-4" />,
          label: 'Médico',
          description: 'Proporciona consultas y gestiona pacientes',
        };
      case PublicUserRole.COMPANY:
        return {
          icon: <Building className="h-4 w-4" />,
          label: 'Empresa',
          description: 'Gestiona salud ocupacional de empleados',
        };
      default:
        return { icon: <User className="h-4 w-4" />, label: 'Paciente', description: '' };
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="flex min-h-screen">
        {/* Mitad Izquierda - Información */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary-500 p-12 items-center justify-center">
          <div className="max-w-lg text-white">
            <div className="mb-8">
              <h1 className="text-4xl font-display font-bold mb-4">🏥 AltaMedica</h1>
              <h2 className="text-2xl font-display font-semibold mb-6">
                Registro en Plataforma de Gestión Sanitaria
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Historia Clínica Centralizada</h3>
                  <p className="text-primary-100">
                    Gestiona todos tus registros médicos en un solo lugar con acceso seguro desde
                    cualquier dispositivo.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Compliance Regulatorio</h3>
                  <p className="text-primary-100">
                    Cumplimiento completo de HIPAA y normativas argentinas de protección de datos
                    médicos.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Red de Profesionales</h3>
                  <p className="text-primary-100">
                    Conecta con más de 1,200 médicos verificados y especialistas en toda Argentina.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-primary-100 italic">
                "AltaMedica transformó la gestión de mi consultorio. Ahora puedo centralizar
                historiales, optimizar turnos y mejorar la atención de mis pacientes."
              </p>
              <div className="mt-4 text-sm font-medium">- Dr. Carlos Rodríguez, Cardiología</div>
            </div>
          </div>
        </div>

        {/* Mitad Derecha - Funcionalidad */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Registro en Plataforma
                </h2>
                <p className="text-neutral-600">Accede al sistema de gestión sanitaria integral</p>
              </div>

              {(localError || error) && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <p className="text-red-600 text-sm">{localError || error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <p className="text-green-600 text-sm">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selección de Rol */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Tipo de cuenta *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.values(PublicUserRole).map((role) => {
                      const roleInfo = getRoleInfo(role);
                      return (
                        <label
                          key={role}
                          className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.role === role
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role}
                            checked={formData.role === role}
                            onChange={(e) =>
                              handleInputChange('role', e.target.value as PublicUserRole)
                            }
                            className="sr-only"
                          />
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                formData.role === role
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-neutral-200'
                              }`}
                            >
                              {roleInfo.icon}
                            </div>
                            <div>
                              <div className="font-medium text-neutral-900">{roleInfo.label}</div>
                              <div className="text-sm text-neutral-600">{roleInfo.description}</div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nombre *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Juan"
                        required
                        className="w-full py-3 px-4 pl-12 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Apellido *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Pérez"
                        required
                        className="w-full py-3 px-4 pl-12 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Email *</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full py-3 px-4 pl-12 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full py-3 px-4 pl-12 pr-12 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full py-3 px-4 pl-12 pr-12 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Términos y Condiciones */}
                <div className="flex items-start space-x-3">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="text-sm text-neutral-700">
                    Acepto los{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
                      Términos y Condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
                      Política de Privacidad
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold shadow-altamedica hover:shadow-altamedica-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <span>Crear Cuenta</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OAuth Section */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">O regístrate con</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <button
                    onClick={handleGoogleSignUp}
                    disabled={isSubmitting || isLoading}
                    className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                    <span className="ml-2">Continuar con Google</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-neutral-600 text-sm">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { RegisterForm };
