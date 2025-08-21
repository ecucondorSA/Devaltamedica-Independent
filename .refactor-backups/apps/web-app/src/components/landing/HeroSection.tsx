'use client';

import { Container } from '@/components/layout/Container';
import { Button } from '@altamedica/ui';
import {
  ArrowRight,
  Building2,
  Play,
  Shield,
  Stethoscope,
  Target,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// === TIPOS TYPESCRIPT ===
interface HeroVideo {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: React.ComponentType<any>;
  readonly videoSrc: string;
}

interface StatCardProps {
  readonly value: string;
  readonly label: string;
  readonly color: string;
}

interface HeroSectionProps {
  className?: string;
}

// === DATOS CONSTANTES ===
const HERO_VIDEOS: readonly HeroVideo[] = [
  {
    title: 'Consultas Médicas en Video',
    subtitle: 'Atención profesional desde tu hogar',
    icon: Video,
    videoSrc: '/videos/consultas-demo.mp4',
  },
  {
    title: 'Telemedicina Empresarial',
    subtitle: 'Cuidado de salud para tus colaboradores',
    icon: Building2,
    videoSrc: '/videos/empresa-demo.mp4',
  },
  {
    title: 'Diagnóstico Inteligente',
    subtitle: 'Análisis asistido por IA',
    icon: Target,
    videoSrc: '/videos/diagnostico-demo.mp4',
  },
];

// === HOOKS PERSONALIZADOS ===
const useVideoCarousel = (videos: readonly HeroVideo[], interval = 8000) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isPaused || videos.length <= 1) return undefined;

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
    return undefined;
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
        className={`absolute top-4 right-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={toggleMute}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar video'}
          title={isMuted ? 'Activar sonido' : 'Silenciar video'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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

const HeroSection = React.memo<HeroSectionProps>(({ className = '' }) => {
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
      className={`relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 pt-16 ${className}`}
      onMouseEnter={pauseCarousel}
      onMouseLeave={resumeCarousel}
    >
      <Container size="2xl" className="relative py-20">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Contenido principal - Left Column */}
          <div className="flex-1 space-y-8 motion-safe:animate-in motion-safe:slide-in-from-left-10 motion-safe:duration-1000">
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
                variant="outline"
                className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-300 flex items-center justify-center backdrop-blur focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
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

          {/* Video Player - Right Column */}
          <div className="flex-1 motion-safe:animate-in motion-safe:slide-in-from-right-10 motion-safe:duration-1000 motion-safe:delay-200">
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
      </Container>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;
