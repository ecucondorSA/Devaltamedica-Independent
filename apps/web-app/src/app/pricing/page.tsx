'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button, Card, Badge } from '@altamedica/ui';
import Link from 'next/link';
import { 
  Check, 
  X, 
  Zap,
  Users,
  Building,
  ArrowRight,
  Info
} from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Básico',
      description: 'Para pacientes individuales',
      icon: Users,
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'ARS',
      features: [
        { text: '3 consultas mensuales', included: true },
        { text: 'Chat con médicos', included: true },
        { text: 'Historial médico digital', included: true },
        { text: 'Recetas electrónicas', included: true },
        { text: 'Videollamadas HD', included: false },
        { text: 'Especialistas prioritarios', included: false },
        { text: 'Análisis con IA', included: false },
        { text: 'Soporte 24/7', included: false }
      ],
      cta: 'Comenzar Gratis',
      ctaVariant: 'outline' as const,
      popular: false
    },
    {
      name: 'Premium',
      description: 'Para familias y uso frecuente',
      icon: Zap,
      monthlyPrice: 4999,
      yearlyPrice: 49990,
      currency: 'ARS',
      features: [
        { text: 'Consultas ilimitadas', included: true },
        { text: 'Chat con médicos', included: true },
        { text: 'Historial médico digital', included: true },
        { text: 'Recetas electrónicas', included: true },
        { text: 'Videollamadas HD', included: true },
        { text: 'Especialistas prioritarios', included: true },
        { text: 'Análisis con IA', included: true },
        { text: 'Soporte 24/7', included: false }
      ],
      cta: 'Comenzar Prueba',
      ctaVariant: 'default' as const,
      popular: true
    },
    {
      name: 'Empresarial',
      description: 'Para empresas y organizaciones',
      icon: Building,
      monthlyPrice: null,
      yearlyPrice: null,
      currency: 'ARS',
      features: [
        { text: 'Todo de Premium', included: true },
        { text: 'Portal corporativo', included: true },
        { text: 'Gestión de empleados', included: true },
        { text: 'Reportes y analytics', included: true },
        { text: 'API personalizada', included: true },
        { text: 'Integración con sistemas', included: true },
        { text: 'Account manager dedicado', included: true },
        { text: 'Soporte 24/7 prioritario', included: true }
      ],
      cta: 'Contactar Ventas',
      ctaVariant: 'outline' as const,
      popular: false
    }
  ];

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Personalizado';
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const faqs = [
    {
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: 'Sí, puedes actualizar o cambiar tu plan en cualquier momento desde tu panel de control.'
    },
    {
      question: '¿Hay período de prueba?',
      answer: 'El plan Premium incluye 14 días de prueba gratis. No se requiere tarjeta de crédito.'
    },
    {
      question: '¿Los médicos están certificados?',
      answer: 'Todos nuestros profesionales están debidamente certificados y verificados por el Ministerio de Salud.'
    },
    {
      question: '¿Cómo funciona el reembolso con obras sociales?',
      answer: 'Trabajamos con las principales obras sociales. Consulta la lista completa en tu perfil.'
    }
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Planes y Precios Transparentes
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Elige el plan que mejor se adapte a tus necesidades. 
              Sin costos ocultos, sin sorpresas.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1 mb-12">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full transition-all ${
                  billingCycle === 'yearly' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600'
                }`}
              >
                Anual
                <Badge className="ml-2 bg-green-100 text-green-800">
                  -20%
                </Badge>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card 
                  key={index}
                  className={`relative p-8 ${
                    plan.popular 
                      ? 'border-2 border-blue-500 shadow-xl scale-105' 
                      : 'border border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                      Más Popular
                    </Badge>
                  )}
                  
                  <div className="text-center mb-6">
                    <plan.icon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-gray-900">
                      {formatPrice(
                        billingCycle === 'monthly' 
                          ? plan.monthlyPrice 
                          : plan.yearlyPrice
                      )}
                    </div>
                    {plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                      <div className="text-gray-600">
                        {billingCycle === 'monthly' ? '/mes' : '/año'}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-gray-900' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.name === 'Empresarial' ? '/contact' : '/auth/register'}>
                    <Button 
                      variant={plan.ctaVariant}
                      size="lg"
                      className="w-full"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              ¿Por qué elegir AltaMedica?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Atención Inmediata</h3>
                <p className="text-gray-600">
                  Conecta con un médico en menos de 5 minutos, sin turnos ni esperas.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
                <p className="text-gray-600">
                  Certificación HIPAA y encriptación de grado médico para tu privacidad.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Red Nacional</h3>
                <p className="text-gray-600">
                  Más de 1,000 especialistas en toda Argentina disponibles 24/7.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Preguntas Frecuentes
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="p-6">
                  <div className="flex gap-4">
                    <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">¿Tienes más preguntas?</p>
              <Link href="/contact">
                <Button variant="outline">
                  Contactar Soporte
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-6">
              Comienza tu Camino hacia una Mejor Salud
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Únete a más de 50,000 argentinos que ya confían en AltaMedica
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary">
                  Comenzar Prueba Gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
                  Hablar con Ventas
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}