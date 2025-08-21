'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Save,
  Camera,
  Plus,
  X,
  Check,
  Edit,
  Globe,
  Phone,
  Mail,
  Linkedin,
  Building,
  Clock,
  Shield,
  Star,
  Activity,
  Stethoscope,
  BookOpen,
  Target,
  Settings,
  ChevronRight
} from 'lucide-react';

// Tipos
interface DoctorProfile {
  // Información básica
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  
  // Información profesional
  medicalLicense: string;
  specialties: string[];
  subSpecialties?: string[];
  yearsOfExperience: number;
  currentPosition?: string;
  currentEmployer?: string;
  
  // Certificaciones y educación
  education: {
    degree: string;
    institution: string;
    year: string;
    country: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }[];
  
  // Ubicación y disponibilidad
  location: {
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
  availability: 'immediate' | 'two_weeks' | 'one_month' | 'negotiable';
  workPreferences: {
    types: ('full-time' | 'part-time' | 'contract' | 'locum')[];
    settings: ('hospital' | 'clinic' | 'private-practice' | 'telemedicine' | 'research')[];
    shifts: ('day' | 'night' | 'rotating' | 'on-call')[];
    remote: boolean;
  };
  
  // Expectativas salariales
  salaryExpectations?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  
  // Idiomas y habilidades
  languages: {
    language: string;
    proficiency: 'native' | 'fluent' | 'professional' | 'basic';
  }[];
  skills: string[];
  equipmentExpertise?: string[];
  
  // Experiencia adicional
  publications?: number;
  researchInterests?: string[];
  teachingExperience?: boolean;
  
  // Enlaces profesionales
  linkedinUrl?: string;
  personalWebsite?: string;
  
  // Biografía
  bio?: string;
  
  // Configuración de privacidad
  profileVisibility: 'public' | 'recruiters_only' | 'private';
  showSalaryExpectations: boolean;
}

// Datos iniciales vacíos
const emptyProfile: DoctorProfile = {
  id: 'doc_123',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  medicalLicense: '',
  specialties: [],
  yearsOfExperience: 0,
  education: [],
  certifications: [],
  location: {
    city: '',
    state: '',
    country: ''
  },
  availability: 'negotiable',
  workPreferences: {
    types: [],
    settings: [],
    shifts: [],
    remote: false
  },
  languages: [],
  skills: [],
  profileVisibility: 'recruiters_only',
  showSalaryExpectations: false
};

// Listas de opciones
const specialtyOptions = [
  'Cardiología', 'Pediatría', 'Neurología', 'Cirugía General', 
  'Medicina Interna', 'Ginecología', 'Psiquiatría', 'Dermatología',
  'Oftalmología', 'Traumatología', 'Endocrinología', 'Gastroenterología',
  'Neumología', 'Urología', 'Oncología', 'Medicina de Emergencia'
];

const languageOptions = [
  'Español', 'Inglés', 'Portugués', 'Francés', 
  'Alemán', 'Italiano', 'Mandarín', 'Japonés'
];

const skillOptions = [
  'Liderazgo de equipo', 'Investigación clínica', 'Docencia médica',
  'Gestión hospitalaria', 'Telemedicina', 'Cirugía mínimamente invasiva',
  'Cuidados intensivos', 'Medicina preventiva', 'Salud pública'
];

export default function DoctorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile>(emptyProfile);
  const [isEditing, setIsEditing] = useState(true);
  const [activeSection, setActiveSection] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Cargar perfil existente
  useEffect(() => {
    loadProfile();
  }, []);

  // Calcular porcentaje de completitud
  useEffect(() => {
    calculateCompletion();
  }, [profile]);

  const loadProfile = async () => {
    // Simular carga de datos
    const savedProfile = localStorage.getItem('doctorProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setIsEditing(false);
    } else {
      // Datos de ejemplo para desarrollo
      setProfile({
        ...emptyProfile,
        firstName: 'Carlos',
        lastName: 'López',
        email: 'dr.lopez@altamedica.com',
        phone: '+54 11 4567-8900',
        medicalLicense: 'MP-12345',
        specialties: ['Cardiología'],
        yearsOfExperience: 10,
        currentPosition: 'Cardiólogo Senior',
        currentEmployer: 'Hospital Central Buenos Aires',
        location: {
          city: 'Buenos Aires',
          state: 'Buenos Aires',
          country: 'Argentina'
        },
        languages: [
          { language: 'Español', proficiency: 'native' },
          { language: 'Inglés', proficiency: 'professional' }
        ]
      });
    }
  };

  const calculateCompletion = () => {
    let completed = 0;
    let total = 0;

    // Información básica
    if (profile.firstName) completed++;
    if (profile.lastName) completed++;
    if (profile.email) completed++;
    if (profile.phone) completed++;
    if (profile.medicalLicense) completed++;
    total += 5;

    // Información profesional
    if (profile.specialties.length > 0) completed++;
    if (profile.yearsOfExperience > 0) completed++;
    if (profile.education.length > 0) completed++;
    if (profile.certifications.length > 0) completed++;
    total += 4;

    // Ubicación
    if (profile.location.city) completed++;
    if (profile.location.country) completed++;
    total += 2;

    // Idiomas y habilidades
    if (profile.languages.length > 0) completed++;
    if (profile.skills.length > 0) completed++;
    total += 2;

    // Bio
    if (profile.bio) completed++;
    total += 1;

    const percentage = Math.round((completed / total) * 100);
    setCompletionPercentage(percentage);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Guardar en localStorage por ahora
      localStorage.setItem('doctorProfile', JSON.stringify(profile));
      
      // En producción, enviar al API
      // await api.saveProfile(profile);
      
      setIsEditing(false);
      alert('Perfil guardado exitosamente');
    } catch (error) {
      logger.error('Error saving profile:', error);
      alert('Error al guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof DoctorProfile],
        [field]: value
      }
    }));
  };

  // Componente para las secciones del perfil
  const ProfileSection = ({ 
    title, 
    icon: Icon, 
    children,
    sectionId
  }: { 
    title: string; 
    icon: any; 
    children: React.ReactNode;
    sectionId: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div 
        className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={() => setActiveSection(activeSection === sectionId ? '' : sectionId)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className="w-5 h-5 text-gray-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              activeSection === sectionId ? 'rotate-90' : ''
            }`}
          />
        </div>
      </div>
      {activeSection === sectionId && (
        <div className="p-6">{children}</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil Profesional</h1>
              <p className="text-sm text-gray-600 mt-1">
                Completa tu perfil para mejorar tus oportunidades laborales
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      loadProfile(); // Recargar datos originales
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Perfil completado
            </span>
            <span className="text-sm font-medium text-gray-900">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {completionPercentage < 100 && (
            <p className="text-xs text-gray-500 mt-2">
              Completa tu perfil para aparecer en más búsquedas
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información Básica */}
        <ProfileSection
          title="Información Básica"
          icon={User}
          sectionId="basic"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => updateProfile('firstName', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => updateProfile('lastName', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => updateProfile('email', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => updateProfile('phone', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matrícula Profesional
              </label>
              <input
                type="text"
                value={profile.medicalLicense}
                onChange={(e) => updateProfile('medicalLicense', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Años de Experiencia
              </label>
              <input
                type="number"
                value={profile.yearsOfExperience}
                onChange={(e) => updateProfile('yearsOfExperience', parseInt(e.target.value))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Biografía */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biografía Profesional
            </label>
            <textarea
              rows={4}
              value={profile.bio || ''}
              onChange={(e) => updateProfile('bio', e.target.value)}
              disabled={!isEditing}
              placeholder="Describe tu experiencia, logros y objetivos profesionales..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            />
          </div>
        </ProfileSection>

        {/* Especialidades y Habilidades */}
        <ProfileSection
          title="Especialidades y Habilidades"
          icon={Stethoscope}
          sectionId="specialties"
        >
          <div className="space-y-6">
            {/* Especialidades */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidades Médicas
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value && !profile.specialties.includes(e.target.value)) {
                        updateProfile('specialties', [...profile.specialties, e.target.value]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar especialidad</option>
                    {specialtyOptions.map(specialty => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {specialty}
                        <button
                          onClick={() => {
                            updateProfile(
                              'specialties',
                              profile.specialties.filter((_, i) => i !== index)
                            );
                          }}
                          className="ml-2 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Habilidades */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Habilidades Profesionales
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value && !profile.skills.includes(e.target.value)) {
                        updateProfile('skills', [...profile.skills, e.target.value]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar habilidad</option>
                    {skillOptions.map(skill => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {skill}
                        <button
                          onClick={() => {
                            updateProfile(
                              'skills',
                              profile.skills.filter((_, i) => i !== index)
                            );
                          }}
                          className="ml-2 hover:text-green-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ProfileSection>

        {/* Ubicación y Disponibilidad */}
        <ProfileSection
          title="Ubicación y Disponibilidad"
          icon={MapPin}
          sectionId="location"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                value={profile.location.city}
                onChange={(e) => updateNestedField('location', 'city', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado/Provincia
              </label>
              <input
                type="text"
                value={profile.location.state}
                onChange={(e) => updateNestedField('location', 'state', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <input
                type="text"
                value={profile.location.country}
                onChange={(e) => updateNestedField('location', 'country', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disponibilidad
              </label>
              <select
                value={profile.availability}
                onChange={(e) => updateProfile('availability', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              >
                <option value="immediate">Inmediata</option>
                <option value="two_weeks">En 2 semanas</option>
                <option value="one_month">En 1 mes</option>
                <option value="negotiable">Negociable</option>
              </select>
            </div>
          </div>

          {/* Preferencias de trabajo */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Preferencias de Trabajo
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-2">Tipo de empleo</p>
                <div className="flex flex-wrap gap-2">
                  {['full-time', 'part-time', 'contract', 'locum'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.workPreferences.types.includes(type as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateNestedField(
                              'workPreferences',
                              'types',
                              [...profile.workPreferences.types, type]
                            );
                          } else {
                            updateNestedField(
                              'workPreferences',
                              'types',
                              profile.workPreferences.types.filter(t => t !== type)
                            );
                          }
                        }}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {type === 'full-time' ? 'Tiempo completo' :
                         type === 'part-time' ? 'Medio tiempo' :
                         type === 'contract' ? 'Por contrato' : 'Locum'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={profile.workPreferences.remote}
                    onChange={(e) => updateNestedField('workPreferences', 'remote', e.target.checked)}
                    disabled={!isEditing}
                    className="mr-2"
                  />
                  <span className="text-sm">Disponible para trabajo remoto/telemedicina</span>
                </label>
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Idiomas */}
        <ProfileSection
          title="Idiomas"
          icon={Languages}
          sectionId="languages"
        >
          {isEditing && (
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  id="new-language"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar idioma</option>
                  {languageOptions.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <select
                  id="new-proficiency"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Nivel</option>
                  <option value="native">Nativo</option>
                  <option value="fluent">Fluido</option>
                  <option value="professional">Profesional</option>
                  <option value="basic">Básico</option>
                </select>
                <button
                  onClick={() => {
                    const langSelect = document.getElementById('new-language') as HTMLSelectElement;
                    const profSelect = document.getElementById('new-proficiency') as HTMLSelectElement;
                    
                    if (langSelect.value && profSelect.value) {
                      updateProfile('languages', [
                        ...profile.languages,
                        {
                          language: langSelect.value,
                          proficiency: profSelect.value as any
                        }
                      ]);
                      langSelect.value = '';
                      profSelect.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {profile.languages.map((lang, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{lang.language}</span>
                  <span className="ml-3 text-sm text-gray-600">
                    {lang.proficiency === 'native' ? 'Nativo' :
                     lang.proficiency === 'fluent' ? 'Fluido' :
                     lang.proficiency === 'professional' ? 'Profesional' : 'Básico'}
                  </span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => {
                      updateProfile(
                        'languages',
                        profile.languages.filter((_, i) => i !== index)
                      );
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </ProfileSection>

        {/* Expectativas Salariales */}
        <ProfileSection
          title="Expectativas Salariales"
          icon={DollarSign}
          sectionId="salary"
        >
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={profile.showSalaryExpectations}
                onChange={(e) => updateProfile('showSalaryExpectations', e.target.checked)}
                disabled={!isEditing}
                className="mr-2"
              />
              <span className="text-sm">Mostrar expectativas salariales a reclutadores</span>
            </label>

            {profile.showSalaryExpectations && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salario Mínimo
                  </label>
                  <input
                    type="number"
                    value={profile.salaryExpectations?.min || ''}
                    onChange={(e) => updateProfile('salaryExpectations', {
                      ...profile.salaryExpectations,
                      min: parseInt(e.target.value)
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salario Máximo
                  </label>
                  <input
                    type="number"
                    value={profile.salaryExpectations?.max || ''}
                    onChange={(e) => updateProfile('salaryExpectations', {
                      ...profile.salaryExpectations,
                      max: parseInt(e.target.value)
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda
                  </label>
                  <select
                    value={profile.salaryExpectations?.currency || 'USD'}
                    onChange={(e) => updateProfile('salaryExpectations', {
                      ...profile.salaryExpectations,
                      currency: e.target.value
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="ARS">ARS</option>
                    <option value="MXN">MXN</option>
                    <option value="COP">COP</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </ProfileSection>

        {/* Configuración de Privacidad */}
        <ProfileSection
          title="Configuración de Privacidad"
          icon={Shield}
          sectionId="privacy"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilidad del Perfil
              </label>
              <select
                value={profile.profileVisibility}
                onChange={(e) => updateProfile('profileVisibility', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              >
                <option value="public">Público - Visible para todos</option>
                <option value="recruiters_only">Solo Reclutadores</option>
                <option value="private">Privado - Solo yo</option>
              </select>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Mantener tu perfil visible aumenta tus oportunidades
                de ser contactado para nuevas ofertas laborales.
              </p>
            </div>
          </div>
        </ProfileSection>

        {/* Acciones finales */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/marketplace')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Explorar Ofertas
          </button>
          
          {completionPercentage === 100 && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Perfil Completo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}