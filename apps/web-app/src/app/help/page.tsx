'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  Calendar, 
  CreditCard, 
  Shield, 
  Video, 
  FileText,
  ArrowLeft,
  ExternalLink,
  Clock,
  Users
} from 'lucide-react'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  tags: string[]
}

const faqData: FAQItem[] = [
  {
    id: '1',
    category: 'Consultas Médicas',
    question: '¿Cómo programar una cita médica?',
    answer: 'Para programar una cita: 1) Inicia sesión en tu cuenta, 2) Ve a "Citas" en el menú, 3) Selecciona "Nueva Cita", 4) Elige el especialista y horario disponible, 5) Confirma tu cita. Recibirás confirmación por email y SMS.',
    tags: ['citas', 'programar', 'médico']
  },
  {
    id: '2',
    category: 'Consultas Médicas',
    question: '¿Qué necesito para una videoconsulta?',
    answer: 'Para una videoconsulta necesitas: 1) Conexión a internet estable, 2) Cámara y micrófono funcionando, 3) Navegador actualizado (Chrome, Firefox, Safari), 4) Estar en un lugar privado y bien iluminado. Te recomendamos hacer una prueba técnica antes de tu primera consulta.',
    tags: ['videoconsulta', 'requisitos', 'tecnología']
  },
  {
    id: '3',
    category: 'Pagos y Facturación',
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito y débito (Visa, MasterCard, American Express), transferencias bancarias, OXXO, y pagos con MercadoPago. Todos los pagos están protegidos con encriptación de nivel bancario.',
    tags: ['pagos', 'tarjetas', 'métodos']
  },
  {
    id: '4',
    category: 'Pagos y Facturación',
    question: '¿Puedo obtener factura médica?',
    answer: 'Sí, todas las consultas médicas incluyen factura automáticamente. Puedes descargar tu factura desde "Mi Cuenta" > "Historial de Pagos". Las facturas están disponibles 24 horas después del pago.',
    tags: ['factura', 'deducible', 'impuestos']
  },
  {
    id: '5',
    category: 'Cuenta y Seguridad',
    question: '¿Cómo cambio mi contraseña?',
    answer: 'Para cambiar tu contraseña: 1) Ve a "Mi Perfil", 2) Selecciona "Seguridad", 3) Haz clic en "Cambiar Contraseña", 4) Ingresa tu contraseña actual y la nueva, 5) Confirma el cambio. Por seguridad, recomendamos usar contraseñas únicas y fuertes.',
    tags: ['contraseña', 'seguridad', 'cuenta']
  },
  {
    id: '6',
    category: 'Cuenta y Seguridad',
    question: '¿Mi información médica está segura?',
    answer: 'Absolutamente. Cumplimos con HIPAA y usamos encriptación de grado militar (AES-256). Tu información está protegida con múltiples capas de seguridad, acceso restringido y auditorías regulares. Solo tú y tus médicos autorizados pueden acceder a tu información.',
    tags: ['seguridad', 'HIPAA', 'privacidad']
  },
  {
    id: '7',
    category: 'Prescripciones',
    question: '¿Cómo obtengo mis recetas médicas?',
    answer: 'Después de tu consulta, el médico envía la prescripción directamente a tu farmacia preferida o puedes descargarla desde "Mis Recetas". Las prescripciones electrónicas están disponibles inmediatamente después de la consulta.',
    tags: ['recetas', 'prescripciones', 'farmacia']
  },
  {
    id: '8',
    category: 'Emergencias',
    question: '¿Puedo usar AltaMedica para emergencias?',
    answer: 'NO. AltaMedica no es para emergencias médicas. Si tienes una emergencia, llama inmediatamente al 911 o ve al hospital más cercano. Nuestro servicio es para consultas médicas generales, seguimientos y atención no urgente.',
    tags: ['emergencias', '911', 'urgente']
  }
]

const categories = [
  { name: 'Todas', icon: FileText, color: 'blue' },
  { name: 'Consultas Médicas', icon: Heart, color: 'red' },
  { name: 'Pagos y Facturación', icon: CreditCard, color: 'green' },
  { name: 'Cuenta y Seguridad', icon: Shield, color: 'purple' },
  { name: 'Prescripciones', icon: FileText, color: 'orange' },
  { name: 'Emergencias', icon: Phone, color: 'red' }
]

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'Todas' || faq.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver al inicio</span>
            </Link>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Ayuda</h1>
            <p className="text-gray-600">¿En qué podemos ayudarte hoy?</p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar en nuestras preguntas frecuentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-4 px-6 pl-14 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  const isSelected = selectedCategory === category.name
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? `bg-${category.color}-100 text-${category.color}-700 border-2 border-${category.color}-200`
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? `text-${category.color}-600` : 'text-gray-500'}`} />
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Quick Contact */}
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">¿Necesitas más ayuda?</h4>
                <div className="space-y-2">
                  <a
                    href="mailto:soporte@altamedica.com"
                    className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email Soporte</span>
                  </a>
                  <a
                    href="tel:+525512345678"
                    className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 text-sm"
                  >
                    <Phone className="h-4 w-4" />
                    <span>+52 55 1234 5678</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedCategory === 'Todas' ? 'Todas las Preguntas' : selectedCategory}
                </h2>
                <span className="text-sm text-gray-500">
                  {filteredFAQs.length} resultado{filteredFAQs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No encontramos resultados</h3>
                  <p className="text-gray-600">
                    Intenta con otros términos de búsqueda o{' '}
                    <a href="mailto:soporte@altamedica.com" className="text-blue-600 hover:text-blue-800">
                      contáctanos directamente
                    </a>
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                        <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                          {faq.category}
                        </span>
                      </div>
                      <div className="ml-4">
                        {expandedFAQ === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </button>
                    
                    {expandedFAQ === faq.id && (
                      <div className="px-6 pb-6">
                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          
                          {faq.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {faq.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Aún necesitas ayuda?</h2>
            <p className="text-gray-600">Nuestro equipo de soporte está aquí para ti las 24 horas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Email Support */}
            <div className="text-center p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 mb-4">Respuesta en menos de 2 horas</p>
              <a
                href="mailto:soporte@altamedica.com"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center space-x-1"
              >
                <span>soporte@altamedica.com</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Phone Support */}
            <div className="text-center p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Teléfono</h3>
              <p className="text-gray-600 mb-4">Lunes a Domingo 24/7</p>
              <a
                href="tel:+525512345678"
                className="text-green-600 hover:text-green-800 font-medium flex items-center justify-center space-x-1"
              >
                <span>+52 55 1234 5678</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Live Chat */}
            <div className="text-center p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat en Vivo</h3>
              <p className="text-gray-600 mb-4">Disponible durante consultas</p>
              <button className="text-purple-600 hover:text-purple-800 font-medium flex items-center justify-center space-x-1">
                <span>Iniciar Chat</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Emergency Notice */}
          <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-red-900 mb-2">¿Emergencia Médica?</h4>
                <p className="text-red-800 mb-4">
                  Si tienes una emergencia médica, NO uses este chat. Llama inmediatamente al 911 
                  o ve al hospital más cercano.
                </p>
                <div className="flex items-center space-x-4">
                  <a
                    href="tel:911"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Llamar 911
                  </a>
                  <span className="text-red-700 text-sm">En caso de emergencia</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Horarios de Atención</h3>
            </div>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Consultas Médicas:</span>
                <span className="font-medium">24/7</span>
              </div>
              <div className="flex justify-between">
                <span>Soporte Técnico:</span>
                <span className="font-medium">L-D 8:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Emergencias:</span>
                <span className="font-medium text-red-600">Llamar 911</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recursos Adicionales</h3>
            </div>
            <div className="space-y-3">
              <Link
                href="/terms"
                className="flex items-center justify-between text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span>Términos y Condiciones</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/privacy"
                className="flex items-center justify-between text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span>Política de Privacidad</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/status"
                className="flex items-center justify-between text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span>Estado del Sistema</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}