"use client";

import { Button, Card, Input } from '@altamedica/ui';
import { useRouter } from "next/navigation";
import { User, Stethoscope, Building, ArrowRight } from "lucide-react";

export default function SelectRolePage() {
  const router = useRouter();

  const roles = [
    {
      id: "patient",
      title: "Paciente",
      description:
        "Accede a tu información médica, agenda citas y gestiona tu salud",
      icon: User,
      color: "blue",
      features: [
        "Historial médico completo",
        "Agenda de citas",
        "Resultados de laboratorio",
        "Prescripciones digitales",
        "Telemedicina",
      ],
    },
    {
      id: "doctor",
      title: "Médico",
      description: "Gestiona tus pacientes, agenda y práctica médica",
      icon: Stethoscope,
      color: "green",
      features: [
        "Gestión de pacientes",
        "Agenda médica",
        "Historiales clínicos",
        "Prescripciones",
        "Telemedicina",
      ],
    },
    {
      id: "company",
      title: "Empresa Médica",
      description: "Administra tu institución médica y equipo",
      icon: Building,
      color: "purple",
      features: [
        "Gestión de médicos",
        "Reportes y analytics",
        "Facturación",
        "Configuración institucional",
        "Dashboard empresarial",
      ],
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    router.push(`/onboarding/${roleId}`);
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          hover: "hover:border-blue-300 hover:bg-blue-100",
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700",
        };
      case "green":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          hover: "hover:border-green-300 hover:bg-green-100",
          icon: "text-green-600",
          button: "bg-green-600 hover:bg-green-700",
        };
      case "purple":
        return {
          bg: "bg-purple-50",
          border: "border-purple-200",
          hover: "hover:border-purple-300 hover:bg-purple-100",
          icon: "text-purple-600",
          button: "bg-purple-600 hover:bg-purple-700",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          hover: "hover:border-gray-300 hover:bg-gray-100",
          icon: "text-gray-600",
          button: "bg-gray-600 hover:bg-gray-700",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            ¡Bienvenido a Altamedica!
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Selecciona tu rol para comenzar con la configuración personalizada
            de tu experiencia
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {roles.map((role) => {
            const colors = getColorClasses(role.color);
            return (
              <div
                key={role.id}
                className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-8 transition-all duration-300 ${colors.hover} cursor-pointer group`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <div className="text-center mb-6">
                  <div
                    className={`w-20 h-20 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {React.createElement(role.icon, {
                      className: `w-10 h-10 ${colors.icon}`,
                    })}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    {role.title}
                  </h3>
                  <p className="text-slate-600">{role.description}</p>
                </div>

                <div className="space-y-3 mb-8">
                  <h4 className="font-semibold text-slate-800 mb-3">
                    Funcionalidades principales:
                  </h4>
                  {role.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 ${colors.icon} rounded-full`} />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full ${colors.button} text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 group-hover:shadow-lg`}
                >
                  <span>Seleccionar</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            ¿Ya tienes una cuenta?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Iniciar sesión
            </button>
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">
              Configuración Rápida
            </h4>
            <p className="text-slate-600 text-sm">
              Completa tu perfil en menos de 5 minutos y comienza a usar la
              plataforma inmediatamente.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">
              Seguridad Garantizada
            </h4>
            <p className="text-slate-600 text-sm">
              Tus datos médicos están protegidos con los más altos estándares de
              seguridad y privacidad.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">
              Experiencia Optimizada
            </h4>
            <p className="text-slate-600 text-sm">
              Interfaz intuitiva diseñada específicamente para cada rol en el
              ecosistema médico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
