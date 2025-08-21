'use client';

import React from 'react';
import { Button } from '@altamedica/ui';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { 
  Stethoscope, 
  Video, 
  Brain, 
  Shield, 
  Users, 
  FileText,
  Activity,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const services = [
  {
    icon: Stethoscope,
    title: "Historia Clínica Digital",
    description: "Sistema completo de gestión de registros médicos con acceso instantáneo y seguro.",
    features: [
      "Centralización de datos médicos",
      "Acceso multiplataforma",
      "Backup automático",
      "Búsqueda avanzada"
    ],
    color: "text-primary-500"
  },
  {
    icon: Video,
    title: "Telemedicina Avanzada",
    description: "Plataforma de videollamadas médicas con herramientas especializadas integradas.",
    features: [
      "Video HD con baja latencia",
      "Compartir pantalla médica",
      "Grabación de sesiones",
      "Chat en tiempo real"
    ],
    color: "text-success-500"
  },
  {
    icon: Brain,
    title: "Diagnóstico con IA",
    description: "Herramientas de inteligencia artificial para apoyo en diagnósticos médicos.",
    features: [
      "Análisis predictivo",
      "Detección de patrones",
      "Sugerencias diagnósticas",
      "Alertas tempranas"
    ],
    color: "text-purple-500"
  },
  {
    icon: Shield,
    title: "Compliance HIPAA",
    description: "Cumplimiento total de normativas de seguridad y privacidad médica.",
    features: [
      "Encriptación extremo a extremo",
      "Auditoría completa",
      "Control de accesos",
      "Respaldo regulatorio"
    ],
    color: "text-alert-500"
  },
  {
    icon: Users,
    title: "Gestión de Consultorios",
    description: "Administración integral de turnos, pacientes y recursos médicos.",
    features: [
      "Calendario inteligente",
      "Gestión de turnos",
      "Facturación integrada",
      "Reportes automáticos"
    ],
    color: "text-blue-500"
  },
  {
    icon: FileText,
    title: "Reportes y Analytics",
    description: "Dashboard completo con métricas y análisis de rendimiento médico.",
    features: [
      "KPIs médicos",
      "Reportes personalizados",
      "Exportación de datos",
      "Visualización avanzada"
    ],
    color: "text-amber-500"
  }
];

const plans = [
  {
    name: "Profesional",
    price: "$50",
    period: "por médico/mes",
    description: "Para profesionales independientes",
    features: [
      "Hasta 100 pacientes",
      "Telemedicina básica",
      "Historia clínica digital",
      "Soporte por email",
      "1 GB de almacenamiento"
    ],
    cta: "Comenzar Prueba",
    popular: false
  },
  {
    name: "Clínica",
    price: "$120",
    period: "por médico/mes",
    description: "Para clínicas y centros médicos",
    features: [
      "Pacientes ilimitados",
      "Telemedicina avanzada",
      "IA diagnóstica",
      "Soporte prioritario",
      "10 GB de almacenamiento",
      "Integración con equipos",
      "Dashboard analytics"
    ],
    cta: "Solicitar Demo",
    popular: true
  },
  {
    name: "Hospital",
    price: "Personalizado",
    period: "contactar ventas",
    description: "Para hospitales y grandes instituciones",
    features: [
      "Solución a medida",
      "Integración completa",
      "IA avanzada",
      "Soporte 24/7",
      "Almacenamiento ilimitado",
      "Compliance completo",
      "Implementación dedicada"
    ],
    cta: "Contactar Ventas",
    popular: false
  }
];

export default function ServiciosPage() {
  const router = useRouter();

  const handleLogin = () => router.push('/login');
  const handleRegister = () => router.push('/register');

  return (
    <div className="min-h-screen bg-white">
      <Header onLogin={handleLogin} onRegister={handleRegister} />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary-50 to-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-neutral-900 mb-4">
            Servicios AltaMedica
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
            Soluciones médicas integrales diseñadas para modernizar tu práctica 
            y mejorar la atención al paciente con tecnología de vanguardia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">
                Comenzar Prueba Gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                Ver Demo en Vivo
                <Video className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-neutral-900 mb-4">
              Servicios Principales
            </h2>
            <p className="text-xl text-neutral-600">
              Todo lo que necesitas para una práctica médica moderna
            </p>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white p-8 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-lg bg-opacity-10 flex items-center justify-center mb-6 ${service.color.replace('text-', 'bg-')}`}>
                    <Icon className={`w-6 h-6 ${service.color}`} />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-neutral-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-neutral-600">
                        <CheckCircle className="w-4 h-4 text-success-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-neutral-900 mb-4">
              Cómo Funciona
            </h2>
            <p className="text-xl text-neutral-600">
              Implementación simple y rápida en 4 pasos
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Registro</h3>
              <p className="text-neutral-600 text-sm">
                Regístrate y configura tu cuenta en minutos
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Configuración</h3>
              <p className="text-neutral-600 text-sm">
                Personaliza la plataforma según tus necesidades
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Migración</h3>
              <p className="text-neutral-600 text-sm">
                Importa tus datos existentes de forma segura
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">¡Listo!</h3>
              <p className="text-neutral-600 text-sm">
                Comienza a usar todas las funcionalidades
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-neutral-900 mb-4">
              Planes y Precios
            </h2>
            <p className="text-xl text-neutral-600">
              Elige el plan que mejor se adapte a tu práctica médica
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`bg-white p-8 rounded-xl shadow-lg border-2 ${
                  plan.popular ? 'border-primary-500 relative' : 'border-neutral-200'
                } hover:shadow-xl transition-shadow`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-neutral-600 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="text-4xl font-display font-bold text-neutral-900">
                    {plan.price}
                  </div>
                  <div className="text-neutral-500 text-sm">
                    {plan.period}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-neutral-600">
                      <CheckCircle className="w-4 h-4 text-success-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display font-bold mb-4">
            ¿Listo para transformar tu práctica médica?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Únete a más de 1,200 profesionales médicos que ya confían en AltaMedica.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="min-w-[200px]">
                Comenzar Prueba Gratis
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="min-w-[200px] bg-white/10 text-white border-white hover:bg-white hover:text-primary-500">
                Hablar con Ventas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Metadata must be exported from a separate server component file
// or defined in layout.tsx for this route