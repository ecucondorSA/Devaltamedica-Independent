'use client'

import { Shield, Lock, Eye, FileText, Users, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@altamedica/ui'
import Link from 'next/link'

const hipaaCompliances = [
  {
    icon: Shield,
    title: "Protección de Datos",
    description: "Encriptación end-to-end de toda la información médica sensible",
    status: "Implementado"
  },
  {
    icon: Lock,
    title: "Control de Acceso",
    description: "Autenticación multifactor y gestión granular de permisos",
    status: "Implementado"
  },
  {
    icon: Eye,
    title: "Auditoría Completa",
    description: "Registro detallado de todos los accesos y modificaciones",
    status: "Implementado"
  },
  {
    icon: FileText,
    title: "Documentación Legal",
    description: "Políticas, procedimientos y acuerdos de confidencialidad",
    status: "Implementado"
  },
  {
    icon: Users,
    title: "Capacitación del Personal",
    description: "Formación continua en protección de datos médicos",
    status: "En Proceso"
  },
  {
    icon: AlertTriangle,
    title: "Respuesta a Incidentes",
    description: "Protocolos de notificación y respuesta ante vulneraciones",
    status: "Implementado"
  }
]

const technicalMeasures = [
  {
    category: "Encriptación",
    items: [
      "AES-256 para datos en reposo",
      "TLS 1.3 para datos en tránsito",
      "Claves rotativas cada 90 días",
      "Hardware Security Modules (HSM)"
    ]
  },
  {
    category: "Acceso y Autenticación",
    items: [
      "Multi-Factor Authentication (MFA)",
      "Single Sign-On (SSO) empresarial",
      "Gestión de identidades federadas",
      "Tokens de sesión con expiración automática"
    ]
  },
  {
    category: "Monitoreo y Auditoría",
    items: [
      "Logs inmutables de auditoría",
      "Monitoreo en tiempo real 24/7",
      "Alertas automáticas de anomalías",
      "Reportes de cumplimiento automatizados"
    ]
  },
  {
    category: "Infraestructura",
    items: [
      "Centros de datos certificados SOC 2",
      "Respaldos encriptados multi-región",
      "Redundancia geográfica",
      "Plan de recuperación ante desastres"
    ]
  }
]

export default function HipaaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary-50 to-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary-100 rounded-full">
                <Shield className="w-12 h-12 text-primary-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              Cumplimiento <span className="text-primary-600">HIPAA</span>
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
              AltaMedica cumple estrictamente con las regulaciones HIPAA (Health Insurance Portability and Accountability Act) 
              para garantizar la máxima protección de la información médica protegida (PHI).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <FileText className="mr-2 w-5 h-5" />
                Descargar Certificación
              </Button>
              <Button variant="outline" size="lg">
                <Eye className="mr-2 w-5 h-5" />
                Ver Auditoría
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* HIPAA Compliance Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Marco de Cumplimiento HIPAA
            </h2>
            <p className="text-lg text-neutral-600">
              Implementamos todas las salvaguardas administrativas, físicas y técnicas requeridas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hipaaCompliances.map((compliance, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
                <div className="flex items-start mb-4">
                  <div className="p-3 bg-primary-100 rounded-lg mr-4">
                    <compliance.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-neutral-900 mb-2">
                      {compliance.title}
                    </h3>
                    <div className="flex items-center mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        compliance.status === 'Implementado' 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {compliance.status}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-neutral-600 text-sm">
                  {compliance.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Safeguards */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Medidas Técnicas de Seguridad
            </h2>
            <p className="text-lg text-neutral-600">
              Implementación detallada de controles técnicos para protección de datos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {technicalMeasures.map((measure, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="font-semibold text-xl text-neutral-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                  {measure.category}
                </h3>
                <ul className="space-y-2">
                  {measure.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-neutral-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Statement */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Declaración de Cumplimiento
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
            <p className="text-primary-100 text-lg leading-relaxed">
              "AltaMedica certifica que todas las operaciones, sistemas y procedimientos 
              cumplen estrictamente con las regulaciones HIPAA establecidas por el 
              Departamento de Salud y Servicios Humanos de los Estados Unidos. 
              Nuestro compromiso con la privacidad y seguridad de la información 
              médica es inquebrantable."
            </p>
          </div>
          <div className="text-primary-200 text-sm">
            <p className="mb-2">
              <strong>Última Auditoría:</strong> Enero 2025 - Aprobada sin observaciones
            </p>
            <p>
              <strong>Próxima Revisión:</strong> Julio 2025
            </p>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="py-12 bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Desarrollado por Estudiante de Medicina
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Esta plataforma ha sido desarrollada por <strong className="text-primary-400">Eduardo Marques</strong>, 
              estudiante de la Facultad de Medicina de la UBA, con un profundo entendimiento 
              de las necesidades médicas y los requerimientos de privacidad en el sector salud. 
              La implementación HIPAA refleja el compromiso ético y profesional hacia la 
              protección de datos médicos sensibles.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
