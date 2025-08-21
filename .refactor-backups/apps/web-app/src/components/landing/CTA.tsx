'use client';

import { Container } from '@/components/layout/Container';
import { Button } from '@altamedica/ui';
import { Activity, Calendar, Play, Shield, Star } from 'lucide-react';
import React from 'react';

interface CTAProps {
  className?: string;
}

const CTA: React.FC<CTAProps> = ({ className = '' }) => {
  return (
    <section
      id="contact"
      className={`py-20 bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-600 text-white relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-black/20" />

      <Container size="lg" className="relative text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Únete al Futuro de la Medicina
        </h2>

        <p className="text-xl mb-10 text-sky-100 max-w-2xl mx-auto leading-relaxed">
          Miles de profesionales ya transformaron su práctica médica con ALTAMEDICA
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            onClick={() => (window.location.href = '/register')}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            aria-label="Comenzar Gratis"
          >
            <Play className="h-5 w-5 mr-2" />
            Comenzar Gratis
          </Button>

          <Button
            onClick={() => (window.location.href = '/login')}
            className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            aria-label="Iniciar Sesión"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Iniciar Sesión
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sky-200">
          <div className="flex items-center justify-center">
            <Shield className="h-5 w-5 mr-2" />
            <span className="text-sm">Certificación Médica</span>
          </div>
          <div className="flex items-center justify-center">
            <Star className="h-5 w-5 mr-2" />
            <span className="text-sm">4.9★ Satisfacción</span>
          </div>
          <div className="flex items-center justify-center">
            <Activity className="h-5 w-5 mr-2" />
            <span className="text-sm">Soporte 24/7</span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CTA;
