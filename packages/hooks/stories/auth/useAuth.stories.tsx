/**
 * @fileoverview Stories para useAuth
 * @description Documentación interactiva del hook de autenticación médica
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// Mock del hook para Storybook
const mockUseAuth = (config: any = {}) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const mockUsers = {
    'doctor@altamedica.com': {
      id: 'doctor_001',
      email: 'doctor@altamedica.com',
      name: 'Dr. Ana García',
      userType: 'doctor',
      specialty: 'Cardiología',
      licenseNumber: 'MD-12345',
      roles: ['doctor', 'specialist'],
      verified: true,
      avatar: '👩‍⚕️',
      status: 'active'
    },
    'nurse@altamedica.com': {
      id: 'nurse_001',
      email: 'nurse@altamedica.com',
      name: 'Enfermera Carmen López',
      userType: 'nurse',
      roles: ['nurse'],
      verified: true,
      avatar: '👩‍⚕️',
      status: 'active'
    },
    'admin@altamedica.com': {
      id: 'admin_001',
      email: 'admin@altamedica.com',
      name: 'Admin Sistema',
      userType: 'admin',
      roles: ['admin', 'super_admin'],
      verified: true,
      avatar: '👨‍💼',
      status: 'active'
    },
    'patient@altamedica.com': {
      id: 'patient_001',
      email: 'patient@altamedica.com',
      name: 'Juan Pérez',
      userType: 'patient',
      roles: ['patient'],
      verified: true,
      avatar: '👤',
      status: 'active'
    }
  };

  const permissions = {
    doctor: [
      'read_medical_records',
      'write_medical_records',
      'prescribe_medications',
      'access_patient_data',
      'create_appointments',
      'view_analytics'
    ],
    nurse: [
      'read_medical_records',
      'update_vital_signs',
      'access_patient_data',
      'create_appointments'
    ],
    admin: [
      'read_medical_records',
      'write_medical_records',
      'manage_users',
      'system_administration',
      'view_analytics',
      'export_data'
    ],
    patient: [
      'read_own_records',
      'update_profile',
      'book_appointments'
    ]
  };

  return {
    // Estado
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    isEmailVerified: user ? user.verified : false,
    sessionDuration: user ? Math.floor(Math.random() * 3600) : 0,

    // Métodos de autenticación
    login: async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (password === 'wrongpassword') {
        setError(new Error('Credenciales inválidas'));
        setIsLoading(false);
        return;
      }
      
      const foundUser = mockUsers[email as keyof typeof mockUsers];
      if (foundUser) {
        setUser(foundUser);
        setIsEmailVerified(foundUser.verified);
      } else {
        setError(new Error('Usuario no encontrado'));
      }
      
      setIsLoading(false);
    },

    register: async (userData: any) => {
      setIsLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (userData.email === 'existing@altamedica.com') {
        setError(new Error('El email ya está registrado'));
        setIsLoading(false);
        return;
      }
      
      const newUser = {
        id: `${userData.userType}_${Date.now()}`,
        ...userData,
        roles: [userData.userType],
        verified: false,
        avatar: userData.userType === 'doctor' ? '👨‍⚕️' : 
                userData.userType === 'nurse' ? '👩‍⚕️' :
                userData.userType === 'admin' ? '👨‍💼' : '👤',
        status: 'active'
      };
      
      setUser(newUser);
      setIsEmailVerified(false);
      setIsLoading(false);
    },

    logout: async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
      setIsEmailVerified(false);
      setIsLoading(false);
    },

    resetPassword: async (email: string) => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simular envío de email
      setIsLoading(false);
    },

    changePassword: async (newPassword: string) => {
      if (!user) throw new Error('Usuario no autenticado');
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    },

    updateProfile: async (updates: any) => {
      if (!user) throw new Error('Usuario no autenticado');
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      setUser(prev => ({ ...prev, ...updates }));
      setIsLoading(false);
      return { ...user, ...updates };
    },

    sendEmailVerification: async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    },

    refreshTokens: async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsLoading(false);
    },

    // Permisos y roles
    hasRole: (role: string) => {
      return user?.roles?.includes(role) || false;
    },

    hasPermission: (permission: string) => {
      if (!user) return false;
      const userPermissions = user.roles?.reduce((acc, role) => {
        return [...acc, ...(permissions[role as keyof typeof permissions] || [])];
      }, [] as string[]) || [];
      return userPermissions.includes(permission);
    },

    clearError: () => {
      setError(null);
    }
  };
};

// Componente de demostración
const AuthDemo: React.FC<{ config?: any }> = ({ config = {} }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    isEmailVerified,
    sessionDuration,
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    updateProfile,
    sendEmailVerification,
    hasRole,
    hasPermission,
    clearError
  } = mockUseAuth(config);

  const [loginForm, setLoginForm] = useState({ email: 'doctor@altamedica.com', password: 'password123' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'patient',
    specialty: ''
  });
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'profile'>('login');
  const [profileForm, setProfileForm] = useState({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginForm.email, loginForm.password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(registerForm);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      doctor: '#059669',
      nurse: '#0ea5e9',
      admin: '#dc2626',
      patient: '#7c3aed',
      specialist: '#f59e0b'
    };
    return colors[role as keyof typeof colors] || '#6b7280';
  };

  if (isAuthenticated) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        {/* User Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>{user.avatar}</div>
            <div>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Bienvenido, {user.name}</h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
                {user.email} • {user.userType}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {user.roles?.map((role: string) => (
                  <span
                    key={role}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: getRoleColor(role),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {role.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              {isEmailVerified ? (
                <span style={{ color: '#059669', fontSize: '0.875rem' }}>
                  ✅ Email verificado
                </span>
              ) : (
                <div>
                  <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                    ❌ Email no verificado
                  </span>
                  <button
                    onClick={sendEmailVerification}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Enviar verificación
                  </button>
                </div>
              )}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Sesión activa: {formatDuration(sessionDuration)}
            </div>
            <button
              onClick={logout}
              disabled={isLoading}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Cerrando...' : '🚪 Cerrar Sesión'}
            </button>
          </div>
        </div>

        {/* Permissions Dashboard */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>🔐 Permisos Médicos</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {[
                'read_medical_records',
                'write_medical_records', 
                'prescribe_medications',
                'access_patient_data',
                'manage_users',
                'system_administration'
              ].map(permission => (
                <div
                  key={permission}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: hasPermission(permission) ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '4px'
                  }}
                >
                  <span style={{ color: hasPermission(permission) ? '#059669' : '#dc2626' }}>
                    {hasPermission(permission) ? '✅' : '❌'}
                  </span>
                  <span style={{ fontSize: '0.875rem' }}>
                    {permission.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>👤 Información del Usuario</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <strong>ID:</strong> {user.id}
              </div>
              <div>
                <strong>Tipo:</strong> {user.userType}
              </div>
              {user.specialty && (
                <div>
                  <strong>Especialidad:</strong> {user.specialty}
                </div>
              )}
              {user.licenseNumber && (
                <div>
                  <strong>Licencia:</strong> {user.licenseNumber}
                </div>
              )}
              <div>
                <strong>Estado:</strong> 
                <span style={{ 
                  color: user.status === 'active' ? '#059669' : '#dc2626',
                  marginLeft: '0.5rem'
                }}>
                  {user.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => updateProfile({ name: user.name + ' (Actualizado)' })}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginRight: '0.5rem',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                📝 Actualizar Perfil
              </button>
              
              <button
                onClick={() => changePassword('newpassword123')}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                🔑 Cambiar Contraseña
              </button>
            </div>
          </div>
        </div>

        {/* Role-Based Features */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#fefce8',
          border: '1px solid #fef3c7',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>🎯 Funcionalidades por Rol</h3>
          
          {hasRole('doctor') && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>👨‍⚕️ Funcionalidades de Doctor:</strong>
              <ul style={{ marginTop: '0.5rem' }}>
                <li>✅ Acceso completo a registros médicos</li>
                <li>✅ Prescripción de medicamentos</li>
                <li>✅ Creación y gestión de citas</li>
                <li>✅ Análisis y reportes médicos</li>
              </ul>
            </div>
          )}
          
          {hasRole('nurse') && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>👩‍⚕️ Funcionalidades de Enfermera:</strong>
              <ul style={{ marginTop: '0.5rem' }}>
                <li>✅ Lectura de registros médicos</li>
                <li>✅ Actualización de signos vitales</li>
                <li>✅ Gestión de citas</li>
              </ul>
            </div>
          )}
          
          {hasRole('admin') && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>👨‍💼 Funcionalidades de Administrador:</strong>
              <ul style={{ marginTop: '0.5rem' }}>
                <li>✅ Gestión completa de usuarios</li>
                <li>✅ Administración del sistema</li>
                <li>✅ Acceso a analytics y reportes</li>
                <li>✅ Exportación de datos</li>
              </ul>
            </div>
          )}
          
          {hasRole('patient') && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>👤 Funcionalidades de Paciente:</strong>
              <ul style={{ marginTop: '0.5rem' }}>
                <li>✅ Acceso a su historial médico</li>
                <li>✅ Actualización de perfil</li>
                <li>✅ Reserva de citas</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {(['login', 'register'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #0ea5e9' : '2px solid transparent',
              color: activeTab === tab ? '#0ea5e9' : '#64748b',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {tab === 'login' ? '🔐 Iniciar Sesión' : '📝 Registrarse'}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>❌ {error.message}</span>
          <button
            onClick={clearError}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Login Form */}
      {activeTab === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
            🏥 AltaMedica Login
          </h2>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Email:
            </label>
            <select
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="doctor@altamedica.com">👨‍⚕️ doctor@altamedica.com (Doctor)</option>
              <option value="nurse@altamedica.com">👩‍⚕️ nurse@altamedica.com (Enfermera)</option>
              <option value="admin@altamedica.com">👨‍💼 admin@altamedica.com (Admin)</option>
              <option value="patient@altamedica.com">👤 patient@altamedica.com (Paciente)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Contraseña:
            </label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="password123 (correcto) o wrongpassword (error)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.75rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? '🔄 Iniciando sesión...' : '🔐 Iniciar Sesión'}
          </button>

          <button
            type="button"
            onClick={() => resetPassword(loginForm.email)}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#0ea5e9',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      )}

      {/* Register Form */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegister} style={{ display: 'grid', gap: '1rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
            📝 Registro AltaMedica
          </h2>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Nombre completo:
            </label>
            <input
              type="text"
              value={registerForm.name}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Dr. Juan Pérez"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Email:
            </label>
            <input
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="usuario@altamedica.com (no usar existing@altamedica.com)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Contraseña:
            </label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Tipo de usuario:
            </label>
            <select
              value={registerForm.userType}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, userType: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="patient">👤 Paciente</option>
              <option value="doctor">👨‍⚕️ Doctor</option>
              <option value="nurse">👩‍⚕️ Enfermera</option>
              <option value="admin">👨‍💼 Administrador</option>
            </select>
          </div>

          {registerForm.userType === 'doctor' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Especialidad:
              </label>
              <input
                type="text"
                value={registerForm.specialty}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, specialty: e.target.value }))}
                placeholder="Ej: Cardiología, Pediatría, etc."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.75rem',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? '🔄 Registrando...' : '📝 Crear Cuenta'}
          </button>
        </form>
      )}

      {/* Demo Instructions */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#0c4a6e'
      }}>
        <h4 style={{ marginTop: 0 }}>💡 Instrucciones de Demo:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li><strong>Login:</strong> Usa cualquier email de prueba con "password123"</li>
          <li><strong>Error:</strong> Usa "wrongpassword" para ver manejo de errores</li>
          <li><strong>Registro:</strong> No uses "existing@altamedica.com" para ver error</li>
          <li><strong>Roles:</strong> Diferentes usuarios tienen diferentes permisos</li>
        </ul>
      </div>
    </div>
  );
};

// Configuración de Meta
const meta: Meta<typeof AuthDemo> = {
  title: 'Auth Hooks/useAuth',
  component: AuthDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# useAuth

Hook completo de autenticación con soporte para roles médicos, permisos granulares, y compliance HIPAA.

## Características Principales

- ✅ **Autenticación Firebase**: Login/logout seguro con Firebase Auth
- ✅ **Roles Médicos**: Doctor, Enfermera, Admin, Paciente
- ✅ **Permisos Granulares**: Control de acceso por funcionalidad
- ✅ **Gestión de Sesiones**: Timeout automático y refresh de tokens
- ✅ **Verificación de Email**: Proceso completo de verificación
- ✅ **Gestión de Contraseñas**: Cambio y reset seguro
- ✅ **Persistencia**: Estado mantenido entre sesiones
- ✅ **HIPAA Compliance**: Audit trails y encriptación

## Roles y Permisos

### 👨‍⚕️ Doctor
- \`read_medical_records\`
- \`write_medical_records\`
- \`prescribe_medications\`
- \`access_patient_data\`
- \`create_appointments\`
- \`view_analytics\`

### 👩‍⚕️ Enfermera
- \`read_medical_records\`
- \`update_vital_signs\`
- \`access_patient_data\`
- \`create_appointments\`

### 👨‍💼 Admin
- \`manage_users\`
- \`system_administration\`
- \`view_analytics\`
- \`export_data\`

### 👤 Paciente
- \`read_own_records\`
- \`update_profile\`
- \`book_appointments\`
        `
      }
    }
  },
  argTypes: {
    config: {
      control: 'object',
      description: 'Configuración del hook useAuth'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Stories
export const Default: Story = {
  args: {
    config: {
      autoRefresh: true,
      sessionTimeout: 3600000, // 1 hora
      hipaaCompliant: true
    }
  }
};

export const WithSessionTimeout: Story = {
  args: {
    config: {
      autoRefresh: true,
      sessionTimeout: 300000, // 5 minutos
      hipaaCompliant: true,
      onSessionTimeout: () => alert('Sesión expirada por inactividad')
    }
  }
};

export const WithoutAutoRefresh: Story = {
  args: {
    config: {
      autoRefresh: false,
      hipaaCompliant: true,
      refreshInterval: 0
    }
  }
};