"use client";

import React from "react";
import { Container } from "@/components/layout/Container";
import { Disclosure, DisclosureButtonWithIcon, DisclosurePanel } from "@/components/ui/Disclosure";
import {
  Bell,
  MapPin,
  BarChart3,
  Archive,
  Clock,
  Target,
  Activity,
  Heart,
  Brain,
  Shield,
  AlertTriangle,
  Lightbulb,
  AlertCircle,
  Smartphone,
  Lock,
  Infinity,
  FileText,
  Stethoscope,
  Pill,
} from "lucide-react";

interface FeaturesProps {
  className?: string;
}

interface FeatureData {
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const FEATURES_DATA: FeatureData[] = [
  {
    icon: Bell,
    title: "Notificaciones Médicas Inteligentes",
    subtitle: "Alertas personalizadas que salvan vidas y optimizan tu salud",
    content: (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Bell className="h-6 w-6 text-orange-600 mr-3" />
              Tipos de Alertas:
            </h4>
            <div className="space-y-4">
              <div className="bg-red-100 rounded-lg p-4 border border-red-200">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-semibold text-red-800">Críticas</span>
                </div>
                <div className="text-sm text-red-600">
                  Resultados anómalos, citas urgentes
                </div>
              </div>
              <div className="bg-yellow-100 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-semibold text-yellow-800">Preventivas</span>
                </div>
                <div className="text-sm text-yellow-600">
                  Medicamentos, chequeos, vacunas
                </div>
              </div>
              <div className="bg-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center mb-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-800">Proactivas</span>
                </div>
                <div className="text-sm text-blue-600">
                  Recomendaciones de salud personalizadas
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                98.7%
              </div>
              <div className="text-gray-600 mb-4">
                Efectividad en prevención
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Alertas enviadas:</span>
                <span className="font-semibold">127,000+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vidas impactadas:</span>
                <span className="font-semibold">23,000+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: MapPin,
    title: "Red Médica Geolocalizada",
    subtitle: "Encuentra centros médicos cerca de ti al instante, estilo Uber para la salud",
    content: (
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <MapPin className="h-6 w-6 text-teal-600 mr-3" />
              Funciones Principales:
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <Clock className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                <div className="text-xl font-bold text-slate-800">
                  &lt; 2min
                </div>
                <div className="text-sm text-gray-600">
                  Búsqueda promedio
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <Target className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                <div className="text-xl font-bold text-slate-800">
                  500m
                </div>
                <div className="text-sm text-gray-600">
                  Radio mínimo precisión GPS
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <Activity className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                <div className="text-xl font-bold text-slate-800">
                  24/7
                </div>
                <div className="text-sm text-gray-600">
                  Disponibilidad en tiempo real
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-teal-600 mb-2">
                5,847
              </div>
              <div className="text-gray-600 mb-4">Centros Médicos</div>
              <div className="text-sm text-gray-500">En tiempo real</div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Con GPS integrado:</span>
                <span className="font-semibold">100%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Precios actualizados:</span>
                <span className="font-semibold">89%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Con reviews:</span>
                <span className="font-semibold">94%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Analytics de Salud Avanzado",
    subtitle: "Reportes médicos inteligentes que revelan patrones ocultos en tu salud",
    content: (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <BarChart3 className="h-6 w-6 text-violet-600 mr-3" />
              Funciones Principales:
            </h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <Activity className="h-6 w-6 text-violet-600 mr-3" />
                <span>Tendencias personalizadas</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-6 w-6 text-violet-600 mr-3" />
                <span>Factores de riesgo cardiovascular</span>
              </div>
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-violet-600 mr-3" />
                <span>Patrones de comportamiento</span>
              </div>
              <div className="flex items-center">
                <Target className="h-6 w-6 text-violet-600 mr-3" />
                <span>Predicciones a 5 años</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-violet-600 mb-2">
                2.1M+
              </div>
              <div className="text-gray-600 mb-4">Reportes generados</div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Patrones detectados:</span>
                <span className="font-semibold">847K+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Prevenciones exitosas:</span>
                <span className="font-semibold">156K+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Análisis predictivos:</span>
                <span className="font-semibold">89K+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Archive,
    title: "Historial Médico de por Vida",
    subtitle: "Tus datos médicos seguros y accesibles para siempre, cuando los necesites",
    content: (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Archive className="h-6 w-6 text-emerald-600 mr-3" />
              Acceso Permanente:
            </h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center mr-3">
                  <Infinity className="h-5 w-5" />
                </div>
                <span>Almacenamiento seguro de por vida</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center mr-3">
                  <Lock className="h-5 w-5" />
                </div>
                <span>Encriptación de nivel bancario</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center mr-3">
                  <Smartphone className="h-5 w-5" />
                </div>
                <span>Acceso desde cualquier dispositivo</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                15+
              </div>
              <div className="text-gray-600 mb-4">
                Años de historial promedio
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-1" />
                  Consultas:
                </span>
                <span className="font-semibold">2.4M+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Exámenes:
                </span>
                <span className="font-semibold">890K+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Pill className="h-4 w-4 mr-1" />
                  Prescripciones:
                </span>
                <span className="font-semibold">1.2M+</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 bg-white/80 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-start text-emerald-700">
            <Shield className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h5 className="font-semibold mb-2">Garantía de Permanencia</h5>
              <p className="text-sm">
                Tu información médica estará disponible incluso después de
                20, 30 o 50 años. Perfecto para tratamientos crónicos,
                seguimientos a largo plazo o emergencias.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

const FeatureCard = React.memo<{ feature: FeatureData }>(({ feature }) => (
  <Disclosure className="card overflow-hidden motion-safe:fade-in">
    <DisclosureButtonWithIcon className="p-6 hover:bg-slate-50 transition-colors duration-200">
      <div className="flex items-start">
        <div className="mr-4 p-2 bg-gradient-to-br from-sky-100 to-blue-100 rounded-lg">
          <feature.icon className="h-6 w-6 text-sky-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{feature.title}</h3>
          <p className="text-slate-600 text-left">{feature.subtitle}</p>
        </div>
      </div>
    </DisclosureButtonWithIcon>
    <DisclosurePanel className="px-6 pb-6">
      {feature.content}
    </DisclosurePanel>
  </Disclosure>
));

FeatureCard.displayName = "FeatureCard";

const FeaturesSection: React.FC<FeaturesProps> = ({ className = "" }) => {
  return (
    <section 
      id="features" 
      className={`py-24 bg-gradient-to-br from-white/80 via-slate-50/50 to-white/80 backdrop-blur-sm ${className}`}
    >
      <Container size="2xl">
        {/* Header Section */}
        <div className="text-center mb-20 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000">
          <div className="inline-flex items-center bg-gradient-to-r from-sky-100 to-blue-100 rounded-full px-6 py-3 mb-6">
            <Shield className="h-5 w-5 text-sky-600 mr-2" />
            <span className="text-sm font-semibold text-sky-700">TECNOLOGÍA MÉDICA AVANZADA</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
            Lo que Hace Único a{" "}
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              ALTAMEDICA
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Descubre por qué somos la plataforma médica más avanzada del mercado,
            con tecnología que transforma la experiencia de atención médica.
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-8">
          {FEATURES_DATA.map((feature, index) => (
            <div
              key={feature.title}
              className={`motion-safe:animate-in motion-safe:slide-in-from-bottom-8 motion-safe:duration-700`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <FeatureCard feature={feature} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000 motion-safe:delay-700">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-8 border border-sky-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              ¿Listo para experimentar el futuro de la medicina?
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Únete a miles de pacientes y profesionales que ya disfrutan de una
              atención médica más inteligente, accesible y personalizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Comenzar Ahora
              </button>
              <button className="px-8 py-3 bg-white text-slate-700 rounded-lg font-semibold border border-slate-200 hover:bg-slate-50 transition-all duration-300">
                Ver Demo
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection;
