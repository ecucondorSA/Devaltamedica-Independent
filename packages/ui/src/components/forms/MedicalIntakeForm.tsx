// 📋 FORMULARIO DE INGRESO MÉDICO - ALTAMEDICA
// Formulario inteligente para captura de información médica del paciente
// Con validación en tiempo real, autoguardado y cumplimiento HIPAA

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  User, Calendar, Phone, Mail, MapPin, Heart, 
  AlertCircle, Pill, Activity, FileText, Save,
  Check, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import { ButtonCorporate } from '../corporate/ButtonCorporate';
import { CardCorporate, CardHeaderCorporate, CardContentCorporate } from '../corporate/CardCorporate';
import { Input } from '../Input';
import { StatusBadge } from '../medical/StatusBadge';

import { logger } from '@altamedica/shared/services/logger.service';
// 📝 TIPOS DEL FORMULARIO
export interface MedicalIntakeData {
  // Información Personal
  personal: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other' | '';
    dni: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  
  // Información Médica
  medical: {
    bloodType: string;
    allergies: string[];
    currentMedications: Array<{
      name: string;
      dose: string;
      frequency: string;
    }>;
    chronicConditions: string[];
    previousSurgeries: Array<{
      procedure: string;
      date: string;
    }>;
    familyHistory: string[];
  };
  
  // Hábitos y Estilo de Vida
  lifestyle: {
    smoker: 'never' | 'former' | 'current' | '';
    alcohol: 'never' | 'occasional' | 'regular' | '';
    exercise: 'none' | 'light' | 'moderate' | 'intense' | '';
    diet: string;
    sleep: string;
  };
  
  // Contacto de Emergencia
  emergency: {
    name: string;
    relationship: string;
    phone: string;
    alternativePhone?: string;
  };
  
  // Seguro Médico
  insurance: {
    hasInsurance: boolean;
    provider?: string;
    planNumber?: string;
    groupNumber?: string;
  };
}

// 🎯 PROPS DEL COMPONENTE
export interface MedicalIntakeFormProps {
  initialData?: Partial<MedicalIntakeData>;
  onSubmit: (data: MedicalIntakeData) => Promise<void>;
  onSave?: (data: Partial<MedicalIntakeData>) => void;
  autoSave?: boolean;
  autoSaveInterval?: number; // milisegundos
  showProgress?: boolean;
  className?: string;
}

// 📊 SECCIONES DEL FORMULARIO
const FORM_SECTIONS = [
  { id: 'personal', label: 'Información Personal', icon: User },
  { id: 'medical', label: 'Historial Médico', icon: Heart },
  { id: 'lifestyle', label: 'Estilo de Vida', icon: Activity },
  { id: 'emergency', label: 'Contacto de Emergencia', icon: AlertCircle },
  { id: 'insurance', label: 'Seguro Médico', icon: FileText },
] as const;

// 🏥 COMPONENTE PRINCIPAL
export const MedicalIntakeForm: React.FC<MedicalIntakeFormProps> = ({
  initialData,
  onSubmit,
  onSave,
  autoSave = true,
  autoSaveInterval = 30000, // 30 segundos
  showProgress = true,
  className = ''
}) => {
  // 📊 ESTADO DEL FORMULARIO
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<MedicalIntakeData>({
    personal: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      dni: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      ...initialData?.personal
    },
    medical: {
      bloodType: '',
      allergies: [],
      currentMedications: [],
      chronicConditions: [],
      previousSurgeries: [],
      familyHistory: [],
      ...initialData?.medical
    },
    lifestyle: {
      smoker: '',
      alcohol: '',
      exercise: '',
      diet: '',
      sleep: '',
      ...initialData?.lifestyle
    },
    emergency: {
      name: '',
      relationship: '',
      phone: '',
      ...initialData?.emergency
    },
    insurance: {
      hasInsurance: false,
      ...initialData?.insurance
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 🔄 AUTO-GUARDADO
  useEffect(() => {
    if (autoSave && hasChanges && onSave) {
      const timer = setTimeout(() => {
        onSave(formData);
        setLastSaved(new Date());
        setHasChanges(false);
      }, autoSaveInterval);

      return () => clearTimeout(timer);
    }
  }, [formData, hasChanges, autoSave, autoSaveInterval, onSave]);

  // 📝 ACTUALIZAR CAMPO
  const updateField = useCallback((
    section: keyof MedicalIntakeData,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
    
    // Limpiar error del campo
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${section}.${field}`];
      return newErrors;
    });
  }, []);

  // ➕ AÑADIR ELEMENTO A LISTA
  const addToList = useCallback((
    section: keyof MedicalIntakeData,
    field: string,
    item: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section][field] || []), item]
      }
    }));
    setHasChanges(true);
  }, []);

  // ➖ ELIMINAR ELEMENTO DE LISTA
  const removeFromList = useCallback((
    section: keyof MedicalIntakeData,
    field: string,
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }));
    setHasChanges(true);
  }, []);

  // ✅ VALIDAR SECCIÓN
  const validateSection = useCallback((sectionId: string): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (sectionId) {
      case 'personal':
        if (!formData.personal.firstName) newErrors['personal.firstName'] = 'Nombre requerido';
        if (!formData.personal.lastName) newErrors['personal.lastName'] = 'Apellido requerido';
        if (!formData.personal.dateOfBirth) newErrors['personal.dateOfBirth'] = 'Fecha de nacimiento requerida';
        if (!formData.personal.dni) newErrors['personal.dni'] = 'DNI requerido';
        if (!formData.personal.email) newErrors['personal.email'] = 'Email requerido';
        if (!formData.personal.phone) newErrors['personal.phone'] = 'Teléfono requerido';
        break;
        
      case 'emergency':
        if (!formData.emergency.name) newErrors['emergency.name'] = 'Nombre de contacto requerido';
        if (!formData.emergency.relationship) newErrors['emergency.relationship'] = 'Relación requerida';
        if (!formData.emergency.phone) newErrors['emergency.phone'] = 'Teléfono de emergencia requerido';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 📋 RENDERIZAR SECCIÓN PERSONAL
  const renderPersonalSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <Input
            value={formData.personal.firstName}
            onChange={(e) => updateField('personal', 'firstName', e.target.value)}
            placeholder="Juan"
            className={errors['personal.firstName'] ? 'border-red-500' : ''}
          />
          {errors['personal.firstName'] && (
            <p className="text-xs text-red-500 mt-1">{errors['personal.firstName']}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido *
          </label>
          <Input
            value={formData.personal.lastName}
            onChange={(e) => updateField('personal', 'lastName', e.target.value)}
            placeholder="Pérez"
            className={errors['personal.lastName'] ? 'border-red-500' : ''}
          />
          {errors['personal.lastName'] && (
            <p className="text-xs text-red-500 mt-1">{errors['personal.lastName']}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Nacimiento *
          </label>
          <Input
            type="date"
            value={formData.personal.dateOfBirth}
            onChange={(e) => updateField('personal', 'dateOfBirth', e.target.value)}
            className={errors['personal.dateOfBirth'] ? 'border-red-500' : ''}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Género *
          </label>
          <select
            value={formData.personal.gender}
            onChange={(e) => updateField('personal', 'gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Seleccionar</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DNI *
          </label>
          <Input
            value={formData.personal.dni}
            onChange={(e) => updateField('personal', 'dni', e.target.value)}
            placeholder="12345678"
            className={errors['personal.dni'] ? 'border-red-500' : ''}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <Input
            type="email"
            value={formData.personal.email}
            onChange={(e) => updateField('personal', 'email', e.target.value)}
            placeholder="juan@email.com"
            className={errors['personal.email'] ? 'border-red-500' : ''}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <Input
            type="tel"
            value={formData.personal.phone}
            onChange={(e) => updateField('personal', 'phone', e.target.value)}
            placeholder="+54 11 1234-5678"
            className={errors['personal.phone'] ? 'border-red-500' : ''}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección
        </label>
        <Input
          value={formData.personal.address}
          onChange={(e) => updateField('personal', 'address', e.target.value)}
          placeholder="Av. Corrientes 1234"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad
          </label>
          <Input
            value={formData.personal.city}
            onChange={(e) => updateField('personal', 'city', e.target.value)}
            placeholder="Buenos Aires"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Postal
          </label>
          <Input
            value={formData.personal.postalCode}
            onChange={(e) => updateField('personal', 'postalCode', e.target.value)}
            placeholder="1234"
          />
        </div>
      </div>
    </div>
  );

  // 🏥 RENDERIZAR SECCIÓN MÉDICA
  const renderMedicalSection = () => {
    const [newAllergy, setNewAllergy] = useState('');
    const [newCondition, setNewCondition] = useState('');
    const [newMedication, setNewMedication] = useState({ name: '', dose: '', frequency: '' });

    return (
      <div className="space-y-6">
        {/* Tipo de Sangre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Sangre
          </label>
          <select
            value={formData.medical.bloodType}
            onChange={(e) => updateField('medical', 'bloodType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Seleccionar</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        {/* Alergias */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alergias
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="Ej: Penicilina, Polen, Maní"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newAllergy.trim()) {
                  addToList('medical', 'allergies', newAllergy.trim());
                  setNewAllergy('');
                }
              }}
            />
            <ButtonCorporate
              variant="secondary"
              size="sm"
              onClick={() => {
                if (newAllergy.trim()) {
                  addToList('medical', 'allergies', newAllergy.trim());
                  setNewAllergy('');
                }
              }}
            >
              Añadir
            </ButtonCorporate>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.medical.allergies.map((allergy, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
              >
                <AlertCircle className="w-3 h-3" />
                {allergy}
                <button
                  onClick={() => removeFromList('medical', 'allergies', index)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Medicamentos Actuales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medicamentos Actuales
          </label>
          <div className="space-y-2 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                value={newMedication.name}
                onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                placeholder="Nombre del medicamento"
              />
              <Input
                value={newMedication.dose}
                onChange={(e) => setNewMedication({ ...newMedication, dose: e.target.value })}
                placeholder="Dosis (ej: 500mg)"
              />
              <div className="flex gap-2">
                <Input
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  placeholder="Frecuencia"
                />
                <ButtonCorporate
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (newMedication.name && newMedication.dose) {
                      addToList('medical', 'currentMedications', newMedication);
                      setNewMedication({ name: '', dose: '', frequency: '' });
                    }
                  }}
                >
                  Añadir
                </ButtonCorporate>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {formData.medical.currentMedications.map((med, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-medium">{med.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {med.dose} - {med.frequency}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromList('medical', 'currentMedications', index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Condiciones Crónicas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condiciones Crónicas
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              placeholder="Ej: Diabetes, Hipertensión"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newCondition.trim()) {
                  addToList('medical', 'chronicConditions', newCondition.trim());
                  setNewCondition('');
                }
              }}
            />
            <ButtonCorporate
              variant="secondary"
              size="sm"
              onClick={() => {
                if (newCondition.trim()) {
                  addToList('medical', 'chronicConditions', newCondition.trim());
                  setNewCondition('');
                }
              }}
            >
              Añadir
            </ButtonCorporate>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.medical.chronicConditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
              >
                {condition}
                <button
                  onClick={() => removeFromList('medical', 'chronicConditions', index)}
                  className="ml-1 hover:text-yellow-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 🏃 RENDERIZAR SECCIÓN ESTILO DE VIDA
  const renderLifestyleSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Fuma?
          </label>
          <div className="space-y-2">
            {['never', 'former', 'current'].map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="smoker"
                  value={option}
                  checked={formData.lifestyle.smoker === option}
                  onChange={(e) => updateField('lifestyle', 'smoker', e.target.value)}
                  className="text-primary-500"
                />
                <span className="text-sm">
                  {option === 'never' && 'Nunca'}
                  {option === 'former' && 'Ex-fumador'}
                  {option === 'current' && 'Fumador actual'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Consumo de Alcohol
          </label>
          <div className="space-y-2">
            {['never', 'occasional', 'regular'].map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="alcohol"
                  value={option}
                  checked={formData.lifestyle.alcohol === option}
                  onChange={(e) => updateField('lifestyle', 'alcohol', e.target.value)}
                  className="text-primary-500"
                />
                <span className="text-sm">
                  {option === 'never' && 'Nunca'}
                  {option === 'occasional' && 'Ocasional'}
                  {option === 'regular' && 'Regular'}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ejercicio Físico
        </label>
        <div className="space-y-2">
          {['none', 'light', 'moderate', 'intense'].map((option) => (
            <label key={option} className="flex items-center space-x-2">
              <input
                type="radio"
                name="exercise"
                value={option}
                checked={formData.lifestyle.exercise === option}
                onChange={(e) => updateField('lifestyle', 'exercise', e.target.value)}
                className="text-primary-500"
              />
              <span className="text-sm">
                {option === 'none' && 'No realizo ejercicio'}
                {option === 'light' && 'Ejercicio ligero (1-2 veces/semana)'}
                {option === 'moderate' && 'Ejercicio moderado (3-4 veces/semana)'}
                {option === 'intense' && 'Ejercicio intenso (5+ veces/semana)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción de su Dieta
        </label>
        <textarea
          value={formData.lifestyle.diet}
          onChange={(e) => updateField('lifestyle', 'diet', e.target.value)}
          placeholder="Describa brevemente su dieta habitual..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Horas de Sueño por Noche
        </label>
        <Input
          value={formData.lifestyle.sleep}
          onChange={(e) => updateField('lifestyle', 'sleep', e.target.value)}
          placeholder="Ej: 7-8 horas"
        />
      </div>
    </div>
  );

  // 🚨 RENDERIZAR SECCIÓN EMERGENCIA
  const renderEmergencySection = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-red-800 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Información Importante</span>
        </div>
        <p className="text-sm text-red-700">
          Esta información será utilizada únicamente en caso de emergencia médica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <Input
            value={formData.emergency.name}
            onChange={(e) => updateField('emergency', 'name', e.target.value)}
            placeholder="María García"
            className={errors['emergency.name'] ? 'border-red-500' : ''}
          />
          {errors['emergency.name'] && (
            <p className="text-xs text-red-500 mt-1">{errors['emergency.name']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relación/Parentesco *
          </label>
          <Input
            value={formData.emergency.relationship}
            onChange={(e) => updateField('emergency', 'relationship', e.target.value)}
            placeholder="Esposa, Madre, Hermano..."
            className={errors['emergency.relationship'] ? 'border-red-500' : ''}
          />
          {errors['emergency.relationship'] && (
            <p className="text-xs text-red-500 mt-1">{errors['emergency.relationship']}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono Principal *
          </label>
          <Input
            type="tel"
            value={formData.emergency.phone}
            onChange={(e) => updateField('emergency', 'phone', e.target.value)}
            placeholder="+54 11 1234-5678"
            className={errors['emergency.phone'] ? 'border-red-500' : ''}
          />
          {errors['emergency.phone'] && (
            <p className="text-xs text-red-500 mt-1">{errors['emergency.phone']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono Alternativo
          </label>
          <Input
            type="tel"
            value={formData.emergency.alternativePhone || ''}
            onChange={(e) => updateField('emergency', 'alternativePhone', e.target.value)}
            placeholder="+54 11 9876-5432"
          />
        </div>
      </div>
    </div>
  );

  // 🏥 RENDERIZAR SECCIÓN SEGURO
  const renderInsuranceSection = () => (
    <div className="space-y-6">
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.insurance.hasInsurance}
            onChange={(e) => updateField('insurance', 'hasInsurance', e.target.checked)}
            className="text-primary-500"
          />
          <span className="text-sm font-medium text-gray-700">
            ¿Tiene seguro médico o obra social?
          </span>
        </label>
      </div>

      {formData.insurance.hasInsurance && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obra Social / Prepaga
            </label>
            <Input
              value={formData.insurance.provider || ''}
              onChange={(e) => updateField('insurance', 'provider', e.target.value)}
              placeholder="OSDE, Swiss Medical, IOMA..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Afiliado
              </label>
              <Input
                value={formData.insurance.planNumber || ''}
                onChange={(e) => updateField('insurance', 'planNumber', e.target.value)}
                placeholder="123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan / Grupo
              </label>
              <Input
                value={formData.insurance.groupNumber || ''}
                onChange={(e) => updateField('insurance', 'groupNumber', e.target.value)}
                placeholder="Plan 210"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 🎯 RENDERIZAR SECCIÓN ACTUAL
  const renderCurrentSection = () => {
    switch (FORM_SECTIONS[currentSection].id) {
      case 'personal':
        return renderPersonalSection();
      case 'medical':
        return renderMedicalSection();
      case 'lifestyle':
        return renderLifestyleSection();
      case 'emergency':
        return renderEmergencySection();
      case 'insurance':
        return renderInsuranceSection();
      default:
        return null;
    }
  };

  // 📤 MANEJAR ENVÍO
  const handleSubmit = async () => {
    // Validar todas las secciones requeridas
    const personalValid = validateSection('personal');
    const emergencyValid = validateSection('emergency');

    if (!personalValid || !emergencyValid) {
      // Ir a la primera sección con errores
      if (!personalValid) {
        setCurrentSection(0);
      } else if (!emergencyValid) {
        setCurrentSection(3);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      logger.error('Error al enviar formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 📊 CALCULAR PROGRESO
  const calculateProgress = () => {
    let totalFields = 0;
    let completedFields = 0;

    // Contar campos de información personal
    Object.values(formData.personal).forEach(value => {
      totalFields++;
      if (value) completedFields++;
    });

    // Contar campos médicos
    totalFields += 5; // bloodType + arrays
    if (formData.medical.bloodType) completedFields++;
    if (formData.medical.allergies.length > 0) completedFields++;
    if (formData.medical.currentMedications.length > 0) completedFields++;
    if (formData.medical.chronicConditions.length > 0) completedFields++;

    // Contar campos de estilo de vida
    Object.values(formData.lifestyle).forEach(value => {
      totalFields++;
      if (value) completedFields++;
    });

    // Contar campos de emergencia
    Object.values(formData.emergency).forEach(value => {
      if (value !== undefined) {
        totalFields++;
        if (value) completedFields++;
      }
    });

    // Contar campos de seguro
    totalFields++;
    if (formData.insurance.hasInsurance !== undefined) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const CurrentIcon = FORM_SECTIONS[currentSection].icon;
  const progress = calculateProgress();

  return (
    <CardCorporate 
      variant="default" 
      className={`max-w-4xl mx-auto ${className}`}
      medical={true}
    >
      <CardHeaderCorporate
        title="Formulario de Ingreso Médico"
        subtitle="Complete su información médica para brindarle la mejor atención"
        medical={true}
        actions={
          <div className="flex items-center gap-4">
            {autoSave && lastSaved && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Check className="w-4 h-4 text-green-500" />
                Guardado {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {showProgress && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{progress}% completado</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        }
      />

      <CardContentCorporate>
        {/* NAVEGACIÓN DE SECCIONES */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {FORM_SECTIONS.map((section, index) => {
              const Icon = section.icon;
              const isActive = index === currentSection;
              const isCompleted = index < currentSection;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-primary-100 text-primary-700 shadow-md' 
                      : isCompleted 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {section.label}
                  </span>
                  {isCompleted && <Check className="w-4 h-4 ml-1" />}
                </button>
              );
            })}
          </div>
          
          {/* BARRA DE PROGRESO */}
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
              style={{ width: `${((currentSection + 1) / FORM_SECTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* CONTENIDO DE LA SECCIÓN */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-100 rounded-lg">
              <CurrentIcon className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {FORM_SECTIONS[currentSection].label}
            </h2>
          </div>
          
          {renderCurrentSection()}
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <ButtonCorporate
            variant="outline"
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Anterior
          </ButtonCorporate>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <ButtonCorporate
                variant="ghost"
                onClick={() => {
                  onSave?.(formData);
                  setLastSaved(new Date());
                  setHasChanges(false);
                }}
                icon={<Save className="w-4 h-4" />}
              >
                Guardar Borrador
              </ButtonCorporate>
            )}

            {currentSection < FORM_SECTIONS.length - 1 ? (
              <ButtonCorporate
                variant="primary"
                onClick={() => {
                  if (validateSection(FORM_SECTIONS[currentSection].id)) {
                    setCurrentSection(currentSection + 1);
                  }
                }}
                icon={<ChevronRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Siguiente
              </ButtonCorporate>
            ) : (
              <ButtonCorporate
                variant="medical"
                onClick={handleSubmit}
                loading={isSubmitting}
                loadingText="Enviando..."
                icon={<Check className="w-4 h-4" />}
                gradient={true}
              >
                Completar Registro
              </ButtonCorporate>
            )}
          </div>
        </div>
      </CardContentCorporate>
    </CardCorporate>
  );
};