'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ArrowRight, Heart, Stethoscope, Users, Video } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 🚀 OPTIMIZED LAZY LOADING - Componentes críticos diferidos
const VideoCarousel = dynamic(() => import('@/components/home/VideoCarousel'), {
  loading: () => <OptimizedSkeleton icon={Video} text="Cargando demos..." />,
  ssr: false,
});

const MarketplaceDemoMap = dynamic(() => import('@/components/demo/MarketplaceDemoMapFixed'), {
  loading: () => <OptimizedSkeleton icon={Users} text="Cargando mapa..." />,
  ssr: false,
});

// Debugging tools eliminados del scope de marketing

// 🎨 OPTIMIZED SKELETON COMPONENT - Mejor UX
function OptimizedSkeleton({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden min-h-[400px] relative">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] animate-shimmer"></div>
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto animate-pulse"></div>
            <Icon className="w-8 h-8 text-primary-400 absolute inset-0 m-auto animate-bounce" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded-full w-32 mx-auto animate-pulse"></div>
            <div className="h-3 bg-slate-200 rounded-full w-24 mx-auto animate-pulse delay-75"></div>
          </div>
          <p className="text-xs text-slate-500 font-medium">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | 'company' | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = () => router.push('/auth/login');
  const handleRegister = () => router.push('/auth/register');

  const handleRoleSelect = (role: 'patient' | 'doctor' | 'company') => {
    setSelectedRole(role);
    sessionStorage.setItem('selectedRole', role);
    sessionStorage.setItem('onboardingStarted', 'true');
    router.push(`/auth/register?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onLogin={handleLogin} onRegister={handleRegister} />

      <main>
        {/* Hero Section */}
        <section
          className="relative pt-20 pb-32 overflow-hidden bg-neutral-50"
          aria-label="Sección principal"
        >
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center xl:text-left xl:max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-display font-bold text-neutral-900 mb-6">
                Gestión Inteligente de Salud
                <span className="text-primary-500 block mt-2">Digitalización Médica Integral</span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
                Sistema completo de gestión sanitaria que centraliza historiales clínicos, optimiza
                procesos médicos y facilita la coordinación entre profesionales de la salud.
              </p>

              {/* Onboarding Cards */}
              <div
                className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto xl:mx-0"
                role="group"
                aria-label="Selecciona tu tipo de cuenta"
              >
                <button
                  onClick={() => handleRoleSelect('patient')}
                  className="group bg-white p-6 rounded-xl shadow-altamedica hover:shadow-altamedica-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Registrarse como Paciente"
                >
                  <Heart className="w-12 h-12 text-primary-500 mb-4 mx-auto" aria-hidden="true" />
                  <h3 className="font-display font-semibold text-lg mb-2">Soy Paciente</h3>
                  <p className="text-neutral-600 text-sm">
                    Accede a consultas médicas, gestiona tu historial y recibe atención 24/7
                  </p>
                  <ArrowRight className="w-5 h-5 mt-4 mx-auto text-primary-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleRoleSelect('doctor')}
                  className="group bg-white p-6 rounded-xl shadow-altamedica hover:shadow-altamedica-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Registrarse como Médico"
                >
                  <Stethoscope
                    className="w-12 h-12 text-primary-500 mb-4 mx-auto"
                    aria-hidden="true"
                  />
                  <h3 className="font-display font-semibold text-lg mb-2">Soy Médico</h3>
                  <p className="text-neutral-600 text-sm">
                    Gestiona pacientes, realiza teleconsultas y accede a herramientas de IA
                  </p>
                  <ArrowRight className="w-5 h-5 mt-4 mx-auto text-primary-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleRoleSelect('company')}
                  className="group bg-white p-6 rounded-xl shadow-altamedica hover:shadow-altamedica-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Registrarse como Empresa"
                >
                  <Users className="w-12 h-12 text-primary-500 mb-4 mx-auto" aria-hidden="true" />
                  <h3 className="font-display font-semibold text-lg mb-2">Soy Empresa</h3>
                  <p className="text-neutral-600 text-sm">
                    Planes de salud, gestión de empleados y beneficios corporativos
                  </p>
                  <ArrowRight className="w-5 h-5 mt-4 mx-auto text-primary-500 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Video Demos */}
        <section className="py-16 bg-white" aria-label="Videos demostrativos">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-neutral-900 mb-8 text-center">
              Conoce la Plataforma
            </h2>
            {isClient && <VideoCarousel />}
          </div>
        </section>

        {/* Demo mapa */}
        <section className="py-16 bg-neutral-50" aria-label="Mapa de especialistas médicos">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-neutral-900 mb-8 text-center">
              Encuentra Especialistas Cerca de Ti
            </h2>
            {isClient && <MarketplaceDemoMap />}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
