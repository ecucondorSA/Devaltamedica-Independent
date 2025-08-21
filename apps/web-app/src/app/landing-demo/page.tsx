'use client';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/common';
import { Button } from '@altamedica/ui';
import {
  Activity,
  ArrowRight,
  Brain,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Heart,
  Play,
  Shield,
  Star,
  Stethoscope,
  Target,
  Video,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// === TIPOS TYPESCRIPT ===
interface HeroVideo {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: React.ComponentType<any>;
  readonly videoSrc: string;
}

interface TestimonialProps {
  readonly name: string;
  readonly role: string;
  readonly quote: string;
  readonly icon: React.ComponentType<any>;
  readonly bgColor: string;
}

interface StatCardProps {
  readonly value: string;
  readonly label: string;
  readonly color: string;
}

// === DATOS CONSTANTES ===
const HERO_VIDEOS: readonly HeroVideo[] = [
  {
    title: 'Consultas Médicas en Video',
    subtitle: 'Atiéndete desde casa con especialistas certificados',
    icon: Video,
    videoSrc: '/Video_Listo_Telemedicina.mp4',
  },
  {
    title: 'Encuentra tu Doctor Ideal',
    subtitle: 'IA que conecta síntomas con el especialista perfecto',
    icon: Target,
    videoSrc: '/Video_Listo_Encuentra_Doctor.mp4',
  },
  {
    title: 'Red de Empleos Médicos',
    subtitle: 'Conecta clínicas con profesionales de la salud',
    icon: Building2,
    videoSrc: '/Video_Listo_.mp4',
  },
] as const;

const TESTIMONIALS: readonly TestimonialProps[] = [
  {
    name: 'María González',
    role: 'Paciente',
    quote: 'Encontré al cardiólogo perfecto en menos de 5 minutos.',
    icon: Heart,
    bgColor: 'bg-blue-500',
  },
  {
    name: 'Dr. Carlos Ruiz',
    role: 'Cardiólogo',
    quote: 'Las consultas por video han revolucionado mi práctica.',
    icon: Stethoscope,
    bgColor: 'bg-green-500',
  },
  {
    name: 'Ana Torres',
    role: 'Directora Clínica',
    quote: 'Encontramos los mejores especialistas para nuestra clínica.',
    icon: Building2,
    bgColor: 'bg-purple-500',
  },
] as const;

const FEATURE_SECTIONS = [
  'smart-notifications',
  'medical-locations',
  'health-analytics',
  'lifetime-records',
] as const;

type FeatureSection = (typeof FEATURE_SECTIONS)[number];

// === HOOKS PERSONALIZADOS ===
const useVideoCarousel = (videos: readonly HeroVideo[], interval = 8000) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Early return conditions
    if (!isMounted || isPaused || videos.length <= 1) {
      // Return empty cleanup function for consistency
      return () => {};
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, interval);

    return () => clearInterval(timer);
  }, [videos.length, interval, isPaused, isMounted]);

  const pauseCarousel = useCallback(() => setIsPaused(true), []);
  const resumeCarousel = useCallback(() => setIsPaused(false), []);
  const goToIndex = useCallback((index: number) => setCurrentIndex(index), []);

  return {
    currentIndex,
    isPaused,
    isMounted,
    pauseCarousel,
    resumeCarousel,
    setCurrentIndex: goToIndex,
  };
};

// === COMPONENTES MEMOIZADOS ===
const StatCard = React.memo<StatCardProps>(({ value, label, color }) => (
  <div className="text-center">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-sm text-slate-600">{label}</div>
  </div>
));

StatCard.displayName = 'StatCard';

const TestimonialCard = React.memo<TestimonialProps>(
  ({ name, role, quote, icon: Icon, bgColor }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-all duration-200 hover:bg-white/15">
      <div className="flex items-center mb-3">
        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center mr-3`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-semibold text-sm text-white">{name}</div>
          <div className="text-slate-300 text-xs">{role}</div>
        </div>
      </div>
      <p className="text-slate-300 mb-3 text-sm">"{quote}"</p>
      <div className="flex text-yellow-400">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="h-3 w-3 fill-current" />
        ))}
      </div>
    </div>
  ),
);

TestimonialCard.displayName = 'TestimonialCard';

const VideoPlayer = React.memo<{
  src: string;
  className?: string;
  isMounted?: boolean;
  title: string;
}>(({ src, className = '', isMounted = true, title }) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => setIsVideoLoaded(true), 100);
      return () => clearTimeout(timer);
    }
    // Return empty cleanup function when not mounted
    return () => {};
  }, [isMounted]);

  const toggleMute = () => setIsMuted(!isMuted);

  if (videoError) {
    return (
      <div
        className={`w-full h-full bg-gray-900 rounded-lg flex flex-col items-center justify-center ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="text-white/80 mb-2">No se pudo cargar el video.</div>
        <div className="text-white/60 text-sm">
          Por favor, revisa tu conexión o inténtalo más tarde.
        </div>
      </div>
    );
  }
  if (!isVideoLoaded) {
    return (
      <div
        className={`w-full h-full bg-gray-900 rounded-lg flex items-center justify-center ${className}`}
        aria-busy="true"
      >
        <LoadingSpinner size="md" color="text-white" />
        <span className="ml-2 text-white/60">Cargando video...</span>
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      <video
        className="w-full h-full object-cover rounded-lg"
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        suppressHydrationWarning
        aria-label={`Video demostrativo: ${title}`}
        onError={() => setVideoError(true)}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <source src={src} type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>

      {/* Controles de audio accesibles */}
      <div
        className={`absolute top-4 right-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <button
          onClick={toggleMute}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar video'}
          title={isMuted ? 'Activar sonido' : 'Silenciar video'}
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l4.883-3.924a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l4.883-3.924a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Indicador de estado de audio */}
      {!isMuted && (
        <div className="absolute bottom-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
          🔊 Audio activo
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

const CarouselIndicators = React.memo<{
  videos: readonly HeroVideo[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}>(({ videos, currentIndex, onIndexChange }) => (
  <div className="flex space-x-2 mb-8" role="tablist" aria-label="Video carousel">
    {videos.map((_, index) => (
      <button
        key={index}
        className={`h-1 rounded-full transition-all duration-300 cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
          index === currentIndex ? 'bg-sky-500 w-16' : 'bg-gray-300 w-4 hover:bg-gray-400'
        }`}
        role="tab"
        aria-selected={index === currentIndex}
        aria-label={`Video ${index + 1}: ${videos[index].title}`}
        onClick={() => onIndexChange(index)}
      />
    ))}
  </div>
));

CarouselIndicators.displayName = 'CarouselIndicators';

const HeroSection = React.memo(() => {
  const { currentIndex, pauseCarousel, resumeCarousel, setCurrentIndex, isMounted } =
    useVideoCarousel(HERO_VIDEOS);
  const currentHeroData = HERO_VIDEOS[currentIndex];

  const statsData = useMemo(
    () => [
      { value: '12,547', label: 'Pacientes Conectados', color: 'text-sky-600' },
      {
        value: '1,820',
        label: 'Médicos Disponibles',
        color: 'text-emerald-600',
      },
      { value: '15+', label: 'Años de Historial', color: 'text-green-600' },
    ],
    [],
  );

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 pt-16"
      onMouseEnter={pauseCarousel}
      onMouseLeave={resumeCarousel}
    >
      <div className="relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Contenido principal */}
        <div className="space-y-8">
          {/* Badge de marca */}
          <div className="inline-flex items-center bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <Stethoscope className="h-6 w-6 text-sky-600 mr-3" />
            <span className="text-lg font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              ALTAMEDICA
            </span>
          </div>

          {/* Título dinámico */}
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-800 leading-tight mb-6">
              {currentHeroData.title}
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              {currentHeroData.subtitle}
            </p>
          </div>

          {/* Indicadores de carousel */}
          <CarouselIndicators
            videos={HERO_VIDEOS}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
          />

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => (window.location.href = '/register')}
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              aria-label="Comenzar Gratis"
            >
              Comenzar Gratis
              <Play className="ml-2 h-5 w-5" />
            </Button>

            <Button
              onClick={() => (window.location.href = '/login')}
              className="bg-white/80 backdrop-blur-sm text-slate-700 px-8 py-4 rounded-xl font-semibold border border-slate-200 hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              aria-label="Iniciar Sesión"
            >
              Iniciar Sesión
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-6 pt-8">
            {statsData.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Mensaje de seguridad */}
          <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-sky-200">
            <div className="flex items-center justify-center text-slate-600 text-sm">
              <Shield className="h-4 w-4 mr-2 text-emerald-600" />
              <span>Tus datos médicos seguros y accesibles de por vida</span>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/30">
            <div className="flex items-center mb-4">
              <currentHeroData.icon className="h-8 w-8 text-sky-600 mr-3" />
              <span className="font-semibold text-slate-800">Demo en Vivo</span>
            </div>

            <div className="bg-gray-900 rounded-lg aspect-video mb-4 relative overflow-hidden">
              <VideoPlayer
                src={currentHeroData.videoSrc}
                className="rounded-lg"
                isMounted={isMounted}
                title={currentHeroData.title}
              />
              {isMounted && (
                <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  {currentHeroData.title}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <strong>847</strong> usuarios activos ahora
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';

const ExpandableFeature = React.memo<{
  id: FeatureSection;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onToggle: (id: FeatureSection) => void;
  children: React.ReactNode;
}>(({ id, title, subtitle, isExpanded, onToggle, children }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
    <button
      className="w-full p-6 text-left hover:bg-slate-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-inset"
      onClick={() => onToggle(id)}
      aria-expanded={isExpanded}
      aria-controls={`feature-${id}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600">{subtitle}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-6 w-6 text-slate-400" />
        ) : (
          <ChevronDown className="h-6 w-6 text-slate-400" />
        )}
      </div>
    </button>
    {isExpanded && (
      <div id={`feature-${id}`} className="px-6 pb-6">
        {children}
      </div>
    )}
  </div>
));

ExpandableFeature.displayName = 'ExpandableFeature';

const FeaturesSection = React.memo(() => {
  const [expandedSection, setExpandedSection] = useState<FeatureSection | null>(null);

  const toggleSection = useCallback((id: FeatureSection) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  }, []);

  return (
    <section id="features" className="py-20 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-6">Lo que Hace Único a ALTAMEDICA</h2>
          <p className="text-xl text-slate-600">
            Descubre por qué somos la plataforma médica más avanzada
          </p>
        </div>

        <div className="space-y-6">
          {/* Notificaciones Médicas Inteligentes */}
          <ExpandableFeature
            id="smart-notifications"
            title="🔔 Notificaciones Médicas Inteligentes"
            subtitle="Alertas personalizadas que salvan vidas y optimizan tu salud"
            isExpanded={expandedSection === 'smart-notifications'}
            onToggle={toggleSection}
          >
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-bold text-slate-800 mb-4">Alertas Vitales:</h4>
                  <div className="space-y-3">
                    <div className="bg-red-100 rounded-lg p-3 border border-red-200">
                      <div className="font-semibold text-red-800">🚨 Críticas</div>
                      <div className="text-sm text-red-600">
                        Resultados anómalos, citas urgentes
                      </div>
                    </div>
                    <div className="bg-yellow-100 rounded-lg p-3 border border-yellow-200">
                      <div className="font-semibold text-yellow-800">⚠️ Preventivas</div>
                      <div className="text-sm text-yellow-600">Medicamentos, chequeos, vacunas</div>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
                      <div className="font-semibold text-blue-800">💡 Proactivas</div>
                      <div className="text-sm text-blue-600">
                        Recomendaciones de salud personalizadas
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-orange-600 mb-2">98.7%</div>
                    <div className="text-gray-600">Efectividad en prevención</div>
                  </div>
                  <div className="text-sm text-gray-500 text-center">
                    <strong>127,000+</strong> alertas enviadas
                    <br />
                    <strong>23,000+</strong> vidas impactadas positivamente
                  </div>
                </div>
              </div>
            </div>
          </ExpandableFeature>

          {/* Red Médica Geolocalizada */}
          <ExpandableFeature
            id="medical-locations"
            title="🗺️ Red Médica Geolocalizada"
            subtitle="Encuentra centros médicos cerca de ti al instante, estilo Uber para la salud"
            isExpanded={expandedSection === 'medical-locations'}
            onToggle={toggleSection}
          >
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-bold text-slate-800 mb-4">Funciones Principales:</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                      <Clock className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                      <div className="text-xl font-bold text-slate-800">&lt; 2min</div>
                      <div className="text-sm text-gray-600">Búsqueda promedio</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                      <Target className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                      <div className="text-xl font-bold text-slate-800">500m</div>
                      <div className="text-sm text-gray-600">Radio mínimo precisión GPS</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                      <Activity className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                      <div className="text-xl font-bold text-slate-800">24/7</div>
                      <div className="text-sm text-gray-600">Disponibilidad en tiempo real</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-teal-600 mb-2">5,847</div>
                    <div className="text-gray-600">Centros Médicos</div>
                    <div className="text-sm text-gray-500">En tiempo real</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Con GPS integrado:</span>
                      <span className="font-semibold">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Con precios actualizados:</span>
                      <span className="font-semibold">89%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Con reviews de pacientes:</span>
                      <span className="font-semibold">94%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Con navegación integrada:</span>
                      <span className="font-semibold">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ExpandableFeature>

          {/* Analytics de Salud Avanzado */}
          <ExpandableFeature
            id="health-analytics"
            title="📊 Analytics de Salud Avanzado"
            subtitle="Reportes médicos inteligentes que revelan patrones ocultos en tu salud"
            isExpanded={expandedSection === 'health-analytics'}
            onToggle={toggleSection}
          >
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-bold text-slate-800 mb-4">Funciones Principales:</h4>
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
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-violet-600 mb-2">2.1M+</div>
                    <div className="text-gray-600">Reportes generados</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patrones detectados:</span>
                      <span className="font-semibold">847K+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prevenciones exitosas:</span>
                      <span className="font-semibold">156K+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Análisis predictivos:</span>
                      <span className="font-semibold">89K+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ExpandableFeature>

          {/* Historial Médico de por Vida */}
          <ExpandableFeature
            id="lifetime-records"
            title="📚 Historial Médico de por Vida"
            subtitle="Tus datos médicos seguros y accesibles para siempre, cuando los necesites"
            isExpanded={expandedSection === 'lifetime-records'}
            onToggle={toggleSection}
          >
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-bold text-slate-800 mb-4">Acceso Permanente:</h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        ∞
                      </div>
                      <span>Almacenamiento seguro de por vida</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        🔒
                      </div>
                      <span>Encriptación de nivel bancario</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        📱
                      </div>
                      <span>Acceso desde cualquier dispositivo</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">15+</div>
                    <div className="text-gray-600 mb-4">Años de historial promedio</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consultas almacenadas:</span>
                      <span className="font-semibold">2.4M+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exámenes guardados:</span>
                      <span className="font-semibold">890K+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prescripciones:</span>
                      <span className="font-semibold">1.2M+</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-white/80 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center text-emerald-700">
                  <Shield className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">
                    Tu información médica estará disponible incluso después de 20, 30 o 50 años.
                    Perfecto para tratamientos crónicos, seguimientos a largo plazo o emergencias.
                  </span>
                </div>
              </div>
            </div>
          </ExpandableFeature>
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

const AnamnesisSection = React.memo(() => (
  <section id="about" className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center bg-gradient-to-r from-sky-100 to-blue-100 rounded-full px-4 py-2 mb-6">
            <Brain className="h-5 w-5 text-sky-600 mr-2" />
            <span className="text-sky-700 font-semibold">Innovación Médica</span>
          </div>

          <h2 className="text-4xl font-bold text-slate-800 mb-6">Anamnesis Inmersiva</h2>

          <p className="text-xl text-slate-600 mb-8">
            Revoluciona la recolección de historiales médicos con nuestra tecnología inmersiva que
            combina IA, interfaces intuitivas y análisis predictivo para una atención personalizada.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center">
              <Brain className="h-6 w-6 text-sky-600 mr-3" />
              <span className="text-slate-700">IA que analiza patrones y sugiere diagnósticos</span>
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
            className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
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
    </div>
  </section>
));

AnamnesisSection.displayName = 'AnamnesisSection';

const TestimonialsSection = React.memo(() => (
  <section className="py-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Lo que Dicen Nuestros Usuarios</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((testimonial, index) => (
          <TestimonialCard key={index} {...testimonial} />
        ))}
      </div>
    </div>
  </section>
));

TestimonialsSection.displayName = 'TestimonialsSection';

const CTASection = React.memo(() => (
  <section
    id="contact"
    className="py-20 bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-600 text-white relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-black/20" />

    <div className="relative max-w-4xl mx-auto text-center px-6">
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
    </div>
  </section>
));

CTASection.displayName = 'CTASection';

// === COMPONENTE PRINCIPAL ===

const AltamedicaHomepage: React.FC = () => {
  return (
    <>
      <Header transparent={true} />
      <main className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <AnamnesisSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
};

export default AltamedicaHomepage;
