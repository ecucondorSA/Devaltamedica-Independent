"use client";

import { Button, Card, Input } from '@altamedica/ui';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logger } from '@altamedica/shared/services/logger.service';
import {
  User,
  Stethoscope,
  Calendar,
  Shield,
  CheckCircle,
  GraduationCap,
  MapPin,
} from "lucide-react";

export default function DoctorOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    personalInfo: {},
    credentials: {},
    specialties: [],
    schedule: {},
    preferences: {},
  });

  const steps = [
    {
      id: "personal-info",
      title: "Información Personal",
      icon: User,
      description: "Datos básicos del médico",
    },
    {
      id: "credentials",
      title: "Credenciales Médicas",
      icon: GraduationCap,
      description: "Licencias y certificaciones",
    },
    {
      id: "specialties",
      title: "Especialidades",
      icon: Stethoscope,
      description: "Áreas de especialización",
    },
    {
      id: "schedule",
      title: "Horarios",
      icon: Calendar,
      description: "Disponibilidad de consultas",
    },
    {
      id: "preferences",
      title: "Preferencias",
      icon: Shield,
      description: "Configuración de la práctica",
    },
  ];

  const handleComplete = async () => {
    try {
      logger.info("Onboarding médico completado:", formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/dashboard");
    } catch (error) {
      logger.error("Error al completar onboarding:", error);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Dr. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Profesional *
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="dr.perez@altamedica.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Años de Experiencia
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Licencia *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="MD123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Universidad
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Universidad Nacional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año de Graduación
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="2010"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificaciones
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Cardiología, Medicina Interna"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Selecciona tus Especialidades *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "Cardiología",
                  "Dermatología",
                  "Endocrinología",
                  "Gastroenterología",
                  "Ginecología",
                  "Neurología",
                  "Oftalmología",
                  "Ortopedia",
                  "Pediatría",
                  "Psiquiatría",
                  "Radiología",
                  "Urología",
                ].map((specialty) => (
                  <label
                    key={specialty}
                    className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Horarios de Consulta
              </label>
              <div className="space-y-4">
                {[
                  "Lunes",
                  "Martes",
                  "Miércoles",
                  "Jueves",
                  "Viernes",
                  "Sábado",
                ].map((day) => (
                  <div
                    key={day}
                    className="flex items-center space-x-4 p-4 border border-gray-300 rounded-lg"
                  >
                    <div className="w-20">
                      <span className="text-sm font-medium text-gray-700">
                        {day}
                      </span>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <input
                        type="time"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="09:00"
                      />
                      <input
                        type="time"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="17:00"
                      />
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-600">Disponible</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Preferencias de Consulta
              </label>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-700">Consultas presenciales</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-700">Telemedicina</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-700">Consultas de emergencia</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa de Consulta (USD)
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="150"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Configuración Médica</h1>
          <p className="text-green-100">Completa tu perfil profesional</p>
        </div>

        {/* Progress */}
        <div className="bg-gray-50 px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              Paso {currentStep + 1} de {steps.length}
            </span>
            <span>
              {Math.round(((currentStep + 1) / steps.length) * 100)}% completado
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {React.createElement(steps[currentStep]?.icon, {
                className: "w-8 h-8 text-green-600",
              })}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {steps[currentStep]?.title}
            </h2>
            <p className="text-gray-600">{steps[currentStep]?.description}</p>
          </div>

          <div className="min-h-[400px]">{renderStepContent()}</div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
              currentStep === 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            }`}
          >
            <span>Anterior</span>
          </button>

          <div className="flex items-center space-x-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-green-600"
                    : index < currentStep
                      ? "bg-green-400"
                      : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (currentStep === steps.length - 1) {
                handleComplete();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
            className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Completar</span>
              </>
            ) : (
              <>
                <span>Siguiente</span>
              </>
            )}
          </button>
        </div>

        {/* Skip button */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Omitir configuración por ahora
          </button>
        </div>
      </div>
    </div>
  );
}
