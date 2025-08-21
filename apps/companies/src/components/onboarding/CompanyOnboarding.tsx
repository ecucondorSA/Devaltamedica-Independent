'use client';

import React, { useState } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'company-info',
    title: 'Información de la Empresa',
    description: 'Datos básicos y configuración inicial',
    icon: '🏢'
  },
  {
    id: 'medical-staff',
    title: 'Personal Médico',
    description: 'Agregar doctores y personal de salud',
    icon: '👨‍⚕️'
  },
  {
    id: 'services',
    title: 'Servicios y Especialidades',
    description: 'Configurar servicios médicos ofrecidos',
    icon: '🏥'
  },
  {
    id: 'integration',
    title: 'Integraciones',
    description: 'Conectar sistemas existentes',
    icon: '🔗'
  }
];

export default function CompanyOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    companyName: '',
    companyType: '',
    address: '',
    phone: '',
    email: '',
    specialties: [] as string[],
    staffCount: '',
    hasExistingSystem: false
  });

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, steps[currentStep].id]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'company-info':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Hospital San José"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Institución
              </label>
              <select 
                value={formData.companyType}
                onChange={(e) => setFormData({...formData, companyType: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar tipo</option>
                <option value="hospital">Hospital</option>
                <option value="clinic">Clínica</option>
                <option value="medical-center">Centro Médico</option>
                <option value="laboratory">Laboratorio</option>
                <option value="pharmacy">Farmacia</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Av. Principal 123, Ciudad"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Corporativo
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contacto@hospital.com"
                />
              </div>
            </div>
          </div>
        );
      
      case 'medical-staff':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Médicos
              </label>
              <input
                type="number"
                value={formData.staffCount}
                onChange={(e) => setFormData({...formData, staffCount: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 25"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 Podrás agregar a tu personal médico de forma individual o masiva después de completar el registro.
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="font-medium text-gray-700">Opciones de importación disponibles:</p>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="import" className="mr-3" />
                  <div>
                    <p className="font-medium">📄 Importar desde Excel/CSV</p>
                    <p className="text-sm text-gray-500">Sube un archivo con la información de tu personal</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="import" className="mr-3" />
                  <div>
                    <p className="font-medium">➕ Agregar manualmente</p>
                    <p className="text-sm text-gray-500">Registra a cada médico individualmente</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="import" className="mr-3" />
                  <div>
                    <p className="font-medium">🔗 Conectar sistema existente</p>
                    <p className="text-sm text-gray-500">Integra tu sistema de RRHH actual</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );
      
      case 'services':
        return (
          <div className="space-y-6">
            <div>
              <p className="font-medium text-gray-700 mb-3">Especialidades disponibles en su institución:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Medicina General', 'Pediatría', 'Ginecología', 'Cardiología',
                  'Traumatología', 'Neurología', 'Oftalmología', 'Dermatología',
                  'Psiquiatría', 'Oncología', 'Radiología', 'Cirugía General'
                ].map((specialty) => (
                  <label key={specialty} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mr-3"
                      checked={formData.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, specialties: [...formData.specialties, specialty]});
                        } else {
                          setFormData({...formData, specialties: formData.specialties.filter(s => s !== specialty)});
                        }
                      }}
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                ✅ Has seleccionado {formData.specialties.length} especialidades. Podrás agregar más en cualquier momento.
              </p>
            </div>
          </div>
        );
      
      case 'integration':
        return (
          <div className="space-y-6">
            <div>
              <p className="font-medium text-gray-700 mb-3">¿Utiliza sistemas médicos actualmente?</p>
              <div className="space-y-3">
                <label className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mr-3 mt-1"
                    checked={formData.hasExistingSystem}
                    onChange={(e) => setFormData({...formData, hasExistingSystem: e.target.checked})}
                  />
                  <div>
                    <p className="font-medium">Sistema de Historia Clínica Electrónica (EHR)</p>
                    <p className="text-sm text-gray-500">Conecta tu sistema actual para sincronizar datos</p>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
              <span className="text-4xl mb-3 block">🎉</span>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">¡Casi listo!</h3>
              <p className="text-sm text-purple-700">
                Tu empresa está a punto de unirse a la red médica más grande de Latinoamérica
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Próximos pasos:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Configurar horarios de atención y servicios</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Invitar a tu equipo médico a la plataforma</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Personalizar tu perfil en el marketplace</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Comenzar a recibir pacientes y gestionar citas</span>
                </li>
              </ul>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold
                ${index === currentStep ? 'bg-blue-600 text-white' : 
                  completedSteps.includes(step.id) ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {completedSteps.includes(step.id) ? '✓' : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-1 mx-2 ${
                  completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          {steps.map((step) => (
            <span key={step.id} className="text-center flex-1">{step.title}</span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{steps[currentStep].icon}</span>
            <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h2>
          </div>
          <p className="text-gray-600">{steps[currentStep].description}</p>
        </div>

        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className={`px-6 py-2 rounded-lg font-medium ${
              currentStep === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ← Anterior
          </button>
          
          {currentStep === steps.length - 1 ? (
            <button
              onClick={() => alert('¡Onboarding completado!')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Completar Registro ✓
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}