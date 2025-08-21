'use client';

import { Button, Card, Input } from '@altamedica/ui';
import {
    AlertTriangle,
    Bell,
    Calendar,
    Camera,
    CheckCircle,
    Clock,
    CreditCard,
    Download,
    Eye,
    EyeOff,
    Globe,
    Info,
    Key,
    Lock,
    LogOut,
    Mail,
    MapPin,
    Monitor,
    Phone,
    Save,
    Settings as SettingsIcon,
    Shield,
    Smartphone,
    Stethoscope,
    Trash2,
    User,
    Volume2
} from 'lucide-react';
import React, { useState } from 'react';

interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  avatar?: string;
  bio: string;
  languages: string[];
  certifications: string[];
  workingHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  consultationFee: number;
  acceptsInsurance: boolean;
  telemedicineEnabled: boolean;
}

interface NotificationSettings {
  emailNotifications: {
    appointments: boolean;
    messages: boolean;
    reminders: boolean;
    marketing: boolean;
  };
  pushNotifications: {
    appointments: boolean;
    messages: boolean;
    emergencies: boolean;
    system: boolean;
  };
  smsNotifications: {
    appointments: boolean;
    reminders: boolean;
    emergencies: boolean;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  allowedDevices: string[];
  loginNotifications: boolean;
  accountLockout: boolean;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Mock data - en producción vendría de la API
  const [profile, setProfile] = useState<DoctorProfile>({
    id: 'doc-001',
    firstName: 'Dr. Carlos',
    lastName: 'Rodriguez',
    email: 'carlos.rodriguez@altamedica.com',
    phone: '+1 (555) 123-4567',
    specialization: 'Cardiología',
    licenseNumber: 'CRM-12345',
    address: {
      street: '123 Medical Center Dr',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28001',
      country: 'España'
    },
    bio: 'Cardiólogo con más de 15 años de experiencia en medicina cardiovascular y telemedicina.',
    languages: ['Español', 'Inglés'],
    certifications: ['Cardiología Intervencionista', 'Ecocardiografía', 'Telemedicina'],
    workingHours: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '15:00', enabled: true },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false }
    },
    consultationFee: 150,
    acceptsInsurance: true,
    telemedicineEnabled: true
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: {
      appointments: true,
      messages: true,
      reminders: true,
      marketing: false
    },
    pushNotifications: {
      appointments: true,
      messages: true,
      emergencies: true,
      system: false
    },
    smsNotifications: {
      appointments: true,
      reminders: true,
      emergencies: true
    }
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    sessionTimeout: 30,
    allowedDevices: ['Desktop - Chrome', 'Mobile - Safari'],
    loginNotifications: true,
    accountLockout: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      // Simular guardado en API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day as keyof typeof prev.workingHours], [field]: value }
      }
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'schedule', label: 'Horarios', icon: Calendar },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'billing', label: 'Facturación', icon: CreditCard },
    { id: 'preferences', label: 'Preferencias', icon: SettingsIcon }
  ];

  const SaveButton = () => (
    <button
      onClick={handleSave}
      disabled={isLoading}
      className={`px-6 py-2 rounded-lg flex items-center font-medium transition-all ${
        saveStatus === 'saved' 
          ? 'bg-green-600 text-white' 
          : saveStatus === 'error'
          ? 'bg-red-600 text-white'
          : 'bg-primary-600 text-white hover:bg-primary-700'
      }`}
    >
      {saveStatus === 'saving' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
      {saveStatus === 'saved' && <CheckCircle className="w-4 h-4 mr-2" />}
      {saveStatus === 'error' && <AlertTriangle className="w-4 h-4 mr-2" />}
      {saveStatus === 'idle' && <Save className="w-4 h-4 mr-2" />}
      
      {saveStatus === 'saving' && 'Guardando...'}
      {saveStatus === 'saved' && 'Guardado'}
      {saveStatus === 'error' && 'Error'}
      {saveStatus === 'idle' && 'Guardar Cambios'}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
              <p className="text-sm text-gray-600">Gestiona tu perfil y preferencias</p>
            </div>
            <SaveButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 border-r-4 border-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Información del Perfil</h2>
                  
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                        {profile.avatar ? (
                          <img src={profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-primary-600" />
                        )}
                      </div>
                      <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50">
                        <Camera className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{profile.firstName} {profile.lastName}</h3>
                      <p className="text-sm text-gray-600">{profile.specialization}</p>
                      <button className="mt-2 text-sm text-primary-600 hover:text-primary-700">
                        Cambiar foto de perfil
                      </button>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellidos
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Stethoscope className="w-4 h-4 inline mr-1" />
                        Especialización
                      </label>
                      <input
                        type="text"
                        value={profile.specialization}
                        onChange={(e) => handleProfileChange('specialization', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Licencia
                      </label>
                      <input
                        type="text"
                        value={profile.licenseNumber}
                        onChange={(e) => handleProfileChange('licenseNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biografía
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe tu experiencia y especialidades..."
                    />
                  </div>

                  {/* Address */}
                  <div className="mb-8">
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Dirección
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Calle
                        </label>
                        <input
                          type="text"
                          value={profile.address.street}
                          onChange={(e) => handleAddressChange('street', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ciudad
                        </label>
                        <input
                          type="text"
                          value={profile.address.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado/Provincia
                        </label>
                        <input
                          type="text"
                          value={profile.address.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código Postal
                        </label>
                        <input
                          type="text"
                          value={profile.address.zipCode}
                          onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          País
                        </label>
                        <input
                          type="text"
                          value={profile.address.country}
                          onChange={(e) => handleAddressChange('country', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tarifa de Consulta (€)
                      </label>
                      <input
                        type="number"
                        value={profile.consultationFee}
                        onChange={(e) => handleProfileChange('consultationFee', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div className="flex items-center space-x-4 pt-8">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.acceptsInsurance}
                          onChange={(e) => handleProfileChange('acceptsInsurance', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Acepta seguros</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.telemedicineEnabled}
                          onChange={(e) => handleProfileChange('telemedicineEnabled', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Telemedicina habilitada</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Horarios de Trabajo
                  </h2>
                  
                  <div className="space-y-4">
                    {Object.entries(profile.workingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-24">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={hours.enabled}
                              onChange={(e) => handleWorkingHoursChange(day, 'enabled', e.target.checked)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                              {day === 'monday' ? 'Lunes' :
                               day === 'tuesday' ? 'Martes' :
                               day === 'wednesday' ? 'Miércoles' :
                               day === 'thursday' ? 'Jueves' :
                               day === 'friday' ? 'Viernes' :
                               day === 'saturday' ? 'Sábado' : 'Domingo'}
                            </span>
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={hours.start}
                            onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                            disabled={!hours.enabled}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                          />
                          <span className="text-gray-500">a</span>
                          <input
                            type="time"
                            value={hours.end}
                            onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                            disabled={!hours.enabled}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Nota sobre horarios</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Los horarios configurados aquí se aplicarán a todas tus citas. Los pacientes podrán ver tu disponibilidad basada en estos horarios.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Configuración de Notificaciones
                  </h2>
                  
                  {/* Email Notifications */}
                  <div className="mb-8">
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Notificaciones por Email
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(notifications.emailNotifications).map(([key, value]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotifications(prev => ({
                              ...prev,
                              emailNotifications: { ...prev.emailNotifications, [key]: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {key === 'appointments' ? 'Citas médicas' :
                             key === 'messages' ? 'Mensajes de pacientes' :
                             key === 'reminders' ? 'Recordatorios' : 'Marketing y promociones'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="mb-8">
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Notificaciones Push
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(notifications.pushNotifications).map(([key, value]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotifications(prev => ({
                              ...prev,
                              pushNotifications: { ...prev.pushNotifications, [key]: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {key === 'appointments' ? 'Citas médicas' :
                             key === 'messages' ? 'Mensajes nuevos' :
                             key === 'emergencies' ? 'Emergencias' : 'Notificaciones del sistema'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Notificaciones SMS
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(notifications.smsNotifications).map(([key, value]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotifications(prev => ({
                              ...prev,
                              smsNotifications: { ...prev.smsNotifications, [key]: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            {key === 'appointments' ? 'Confirmaciones de citas' :
                             key === 'reminders' ? 'Recordatorios importantes' : 'Alertas de emergencia'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Configuración de Seguridad
                  </h2>
                  
                  {/* Change Password */}
                  <div className="mb-8">
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <Key className="w-4 h-4 mr-2" />
                      Cambiar Contraseña
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contraseña Actual
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmar Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        Actualizar Contraseña
                      </button>
                    </div>
                  </div>

                  {/* Two Factor Authentication */}
                  <div className="mb-8">
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Autenticación de Dos Factores
                    </h3>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Autenticación de dos factores {security.twoFactorEnabled ? 'habilitada' : 'deshabilitada'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Agrega una capa extra de seguridad a tu cuenta
                        </p>
                      </div>
                      <button
                        onClick={() => setSecurity(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          security.twoFactorEnabled
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {security.twoFactorEnabled ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                    </div>
                  </div>

                  {/* Session Settings */}
                  <div className="mb-8">
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Configuración de Sesión
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tiempo de inactividad (minutos)
                        </label>
                        <select
                          value={security.sessionTimeout}
                          onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                          className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value={15}>15 minutos</option>
                          <option value={30}>30 minutos</option>
                          <option value={60}>1 hora</option>
                          <option value={120}>2 horas</option>
                          <option value={240}>4 horas</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={security.loginNotifications}
                            onChange={(e) => setSecurity(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">Notificar inicios de sesión</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={security.accountLockout}
                            onChange={(e) => setSecurity(prev => ({ ...prev, accountLockout: e.target.checked }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">Bloquear cuenta tras intentos fallidos</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Connected Devices */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      <Monitor className="w-4 h-4 mr-2" />
                      Dispositivos Conectados
                    </h3>
                    <div className="space-y-2">
                      {security.allowedDevices.map((device, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center">
                            <Monitor className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-sm text-gray-900">{device}</span>
                          </div>
                          <button className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Facturación y Pagos
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Payment Methods */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">Métodos de Pago</h3>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="text-center py-8">
                          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No hay métodos de pago configurados</p>
                          <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            Agregar Método de Pago
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Billing History */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">Historial de Facturación</h3>
                      <div className="border border-gray-200 rounded-lg">
                        <div className="text-center py-8">
                          <p className="text-gray-600">No hay facturas disponibles</p>
                        </div>
                      </div>
                    </div>

                    {/* Tax Settings */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">Configuración Fiscal</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            NIF/CIF
                          </label>
                          <input
                            type="text"
                            placeholder="12345678A"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre Fiscal
                          </label>
                          <input
                            type="text"
                            placeholder="Nombre para facturación"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <SettingsIcon className="w-5 h-5 mr-2" />
                    Preferencias del Sistema
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Language & Region */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        Idioma y Región
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Idioma de la Interfaz
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                            <option value="es">Español</option>
                            <option value="en">English</option>
                            <option value="fr">Français</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zona Horaria
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                            <option value="Europe/Madrid">Europa/Madrid</option>
                            <option value="America/New_York">América/Nueva York</option>
                            <option value="Asia/Tokyo">Asia/Tokio</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Theme Settings */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <Monitor className="w-4 h-4 mr-2" />
                        Apariencia
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="theme"
                            value="light"
                            defaultChecked
                            className="border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">Modo claro</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="theme"
                            value="dark"
                            className="border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">Modo oscuro</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="theme"
                            value="auto"
                            className="border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">Automático (según el sistema)</span>
                        </label>
                      </div>
                    </div>

                    {/* Audio Settings */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <Volume2 className="w-4 h-4 mr-2" />
                        Audio
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">Sonidos de notificación</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-700">Sonidos de llamada</span>
                        </label>
                      </div>
                    </div>

                    {/* Data Export */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">Exportar Datos</h3>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Descargar mis datos</p>
                          <p className="text-sm text-gray-600">Exporta todos tus datos en formato JSON</p>
                        </div>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                          <Download className="w-4 h-4 mr-2" />
                          Exportar
                        </button>
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">Acciones de Cuenta</h3>
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
                          <LogOut className="w-4 h-4 mr-2" />
                          Cerrar Sesión en Todos los Dispositivos
                        </button>
                        <button className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar Cuenta
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
