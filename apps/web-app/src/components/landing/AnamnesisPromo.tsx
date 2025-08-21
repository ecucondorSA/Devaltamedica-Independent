'use client';

import { Container } from '@/components/layout/Container';
import { Button } from '@altamedica/ui';
import { Activity, Brain, ChevronRight, Heart, Target } from 'lucide-react';
import React from 'react';

interface AnamnesisPromoProps {
  className?: string;
}

const AnamnesisPromo: React.FC<AnamnesisPromoProps> = ({ className = '' }) => {
  return (
    <section id="about" className={`py-20 bg-white ${className}`}>
      <Container size="2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center bg-gradient-to-r from-sky-100 to-blue-100 rounded-full px-4 py-2 mb-6">
              <Brain className="h-5 w-5 text-sky-600 mr-2" />
              <span className="text-sky-700 font-semibold">Innovación Médica</span>
            </div>

            <h2 className="text-4xl font-bold text-slate-800 mb-6">Anamnesis Inmersiva</h2>

            <p className="text-xl text-slate-600 mb-8">
              Revoluciona la recolección de historiales médicos con nuestra tecnología inmersiva que
              combina IA, interfaces intuitivas y análisis predictivo para una atención
              personalizada.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-sky-600 mr-3" />
                <span className="text-slate-700">
                  IA que analiza patrones y sugiere diagnósticos
                </span>
              </div>
              <div className="flex items-center">
                <Activity className="h-6 w-6 text-blue-600 mr-3" />
                <span className="text-slate-700">Historial clínico digital completo</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-6 w-6 text-cyan-600 mr-3" />
                <span className="text-slate-700">Análisis predictivo de salud</span>
              </div>
            </div>

            <Button
              onClick={() => (window.location.href = '/auth/register')}
              className="btn-primary flex items-center"
              aria-label="Explorar Anamnesis"
            >
              Explorar Anamnesis
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-sky-100 to-blue-100 rounded-3xl p-8 shadow-2xl">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <Target className="h-6 w-6 text-sky-600 mr-2" />
                  <span className="font-semibold text-slate-800">Evaluación Inteligente</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-sky-50 rounded-lg p-3">
                    <div className="text-sm text-sky-700">Síntomas analizados: 24</div>
                    <div className="w-full bg-sky-200 rounded-full h-2 mt-1">
                      <div className="bg-sky-500 h-2 rounded-full w-3/4 transition-all duration-1000"></div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm text-blue-700">Precisión diagnóstica: 94%</div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                      <div className="bg-blue-500 h-2 rounded-full w-11/12 transition-all duration-1000"></div>
                    </div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <div className="text-sm text-emerald-700">
                      <span className="font-medium">Síndrome Cardiovascular</span> → Cardiólogo: 87%
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2 mt-1">
                      <div className="bg-emerald-500 h-2 rounded-full w-5/6 transition-all duration-1000"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 text-center">
                  IA médica procesando patrones complejos...
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AnamnesisPromo;
