import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@altamedica/ui';
import Link from 'next/link';
import { 
  Heart, 
  Users, 
  Shield, 
  Award,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export const metadata = {
  title: 'Acerca de Nosotros - AltaMedica',
  description: 'Conoce a AltaMedica, la plataforma de telemedicina líder en Argentina que conecta pacientes con profesionales de la salud.',
};

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Cuidado Centrado en el Paciente',
      description: 'Ponemos la salud y bienestar de nuestros pacientes en el centro de todo lo que hacemos.'
    },
    {
      icon: Shield,
      title: 'Seguridad y Privacidad',
      description: 'Cumplimiento total con HIPAA y estándares argentinos de protección de datos médicos.'
    },
    {
      icon: Users,
      title: 'Accesibilidad Universal',
      description: 'Democratizamos el acceso a la salud de calidad para todos los argentinos.'
    },
    {
      icon: Award,
      title: 'Excelencia Médica',
      description: 'Trabajamos con los mejores profesionales certificados del país.'
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Pacientes Atendidos' },
    { number: '1,000+', label: 'Médicos Certificados' },
    { number: '98%', label: 'Satisfacción' },
    { number: '24/7', label: 'Disponibilidad' }
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Transformando la Salud Digital en Argentina
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                AltaMedica es la plataforma de telemedicina más avanzada del país, 
                conectando pacientes con profesionales de la salud de manera segura, 
                rápida y eficiente.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Nuestra Misión
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  Revolucionar el acceso a la atención médica en Argentina mediante 
                  tecnología de vanguardia, conectando pacientes con profesionales 
                  de la salud de manera instantánea y segura.
                </p>
                <p className="text-lg text-gray-600 mb-6">
                  Creemos que la salud de calidad debe ser accesible para todos, 
                  sin importar su ubicación geográfica o situación económica.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Certificado HIPAA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>100% Digital</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Atención 24/7</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <Globe className="w-16 h-16 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Visión 2030</h3>
                <p className="text-blue-100">
                  Ser la plataforma de salud digital líder en Latinoamérica, 
                  mejorando la vida de millones de personas a través de 
                  tecnología médica innovadora y accesible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Nuestros Valores
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center text-white">
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Fundado por Médicos, para Médicos y Pacientes
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              AltaMedica fue fundada por el Dr. Eduardo Marques, combinando 
              experiencia médica con innovación tecnológica para crear una 
              plataforma que realmente entiende las necesidades de profesionales 
              y pacientes.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" className="flex items-center gap-2">
                  Contáctanos
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="lg">
                  Únete a Nosotros
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 md:p-12 text-white">
              <div className="flex items-center gap-4 mb-6">
                <Zap className="w-12 h-12" />
                <h2 className="text-3xl font-bold">Tecnología de Vanguardia</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">IA Médica</h3>
                  <p className="text-purple-100">
                    Diagnósticos asistidos por inteligencia artificial con 
                    precisión clínica validada.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">WebRTC HD</h3>
                  <p className="text-purple-100">
                    Videollamadas de alta definición con latencia ultra-baja 
                    para consultas efectivas.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Blockchain</h3>
                  <p className="text-purple-100">
                    Historiales médicos inmutables y verificables con tecnología 
                    blockchain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}