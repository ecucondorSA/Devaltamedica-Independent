"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logger } from '@altamedica/shared/services/logger.service';
import {
  Building,
  Users,
  Calendar,
  Shield,
  CheckCircle,
  MapPin,
  CreditCard,
} from "lucide-react";

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    companyInfo: {},
    location: {},
    services: [],
    staff: {},
    billing: {},
  });

  const steps = [
    {
      id: "company-info",
      title: "Información de la Empresa",
      icon: Building,
      description: "Datos básicos de la institución médica",
    },
    {
      id: "location",
      title: "Ubicación y Contacto",
      icon: MapPin,
      description: "Dirección y información de contacto",
    },
    {
      id: "services",
      title: "Servicios Médicos",
      icon: Users,
      description: "Especialidades y servicios ofrecidos",
    },
    {
      id: "staff",
      title: "Personal Médico",
      icon: Users,
      description: "Configuración del equipo médico",
    },
    {
      id: "billing",
      title: "Facturación",
      icon: CreditCard,
      description: "Configuración de pagos y facturación",
    },
  ];

  const handleComplete = async () => {
    try {
      logger.info("Onboarding empresa completado:", formData);
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
                  Nombre de la Institución *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Hospital Altamedica"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Institución *
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Seleccionar</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clínica</option>
                  <option value="laboratory">Laboratorio</option>
                  <option value="pharmacy">Farmacia</option>
                  <option value="imaging">Centro de Imágenes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Registro Sanitario *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="RS-123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año de Fundación
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="1990"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección Completa *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Av. Principal 123, Ciudad, Estado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado/Provincia *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Estado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono Principal *
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
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
                Servicios Médicos Ofrecidos *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "Consultas Generales",
                  "Cirugía",
                  "Radiología",
                  "Laboratorio",
                  "Farmacia",
                  "Emergencias",
                  "Maternidad",
                  "Pediatría",
                  "Cardiología",
                  "Neurología",
                  "Oncología",
                  "Rehabilitación",
                ].map((service) => (
                  <label
                    key={service}
                    className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horarios de Atención
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Lunes a Viernes
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="8:00 AM - 6:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Sábados
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="8:00 AM - 2:00 PM"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Médicos
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Enfermeros
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Camas (si aplica)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Consultorios
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="15"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Especialidades Principales
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "Medicina General",
                  "Cardiología",
                  "Dermatología",
                  "Endocrinología",
                  "Ginecología",
                  "Neurología",
                  "Oftalmología",
                  "Ortopedia",
                ].map((specialty) => (
                  <label
                    key={specialty}
                    className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Métodos de Pago Aceptados
                </label>
                <div className="space-y-3">
                  {[
                    "Efectivo",
                    "Tarjeta de Crédito",
                    "Tarjeta de Débito",
                    "Transferencia Bancaria",
                    "Seguros Médicos",
                  ].map((method) => (
                    <label key={method} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-gray-700">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Información Bancaria
                </label>
                <div className="space-y-4">
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nombre del Banco"
                  />
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Número de Cuenta"
                  />
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Código SWIFT"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Configuración Empresarial</h1>
          <p className="text-purple-100">Configura tu institución médica</p>
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
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {React.createElement(steps[currentStep]?.icon, {
                className: "w-8 h-8 text-purple-600",
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
                    ? "bg-purple-600"
                    : index < currentStep
                      ? "bg-purple-400"
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
            className="flex items-center space-x-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
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
