'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { ChevronLeft, ChevronRight, Loader2, Maximize, Pause, Play, SkipForward, Volume2, VolumeX } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface Video {
  src: string;
  title: string;
  description?: string;
  poster?: string;
}

export interface VideoCarouselProps {
  videos?: Video[];
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
}

// Default videos with poster images
const DEFAULT_VIDEOS: Video[] = [
  {
    src: "/Video_Listo_.mp4",
    title: "Introducción a AltaMedica",
    description: "Conoce nuestra plataforma médica digital",
    poster: "/posters/intro-poster.jpg"
  },
  {
    src: "/Video_Listo_Encuentra_Doctor.mp4",
    title: "Encuentra tu Doctor",
    description: "Busca especialistas cerca de ti",
    poster: "/posters/doctor-poster.jpg"
  },
  {
    src: "/Video_Listo_Telemedicina.mp4",
    title: "Telemedicina 24/7",
    description: "Consultas médicas desde cualquier lugar",
    poster: "/posters/telemedicine-poster.jpg"
  }
];

const VideoCarouselOptimized: React.FC<VideoCarouselProps> = ({
  videos = DEFAULT_VIDEOS,
  autoPlay = false, // Changed default to false for better performance
  muted = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Verificación de seguridad
  if (!videos || videos.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-lg p-8">
        <p className="text-neutral-500">No hay videos disponibles</p>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (autoPlay && videoRef.current) {
              setIsLoading(true);
              videoRef.current.load();
            }
          } else {
            // Pause video when out of viewport
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVisible) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setError(false);
      if (autoPlay && isVisible) {
        video.play().catch(() => {
          setIsPlaying(false);
        });
      }
    };

    const handleError = () => {
      setError(true);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        setProgress(progress);
      }
    };

    const handleEnded = () => {
      playNextVideo();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [currentVideoIndex, autoPlay, isVisible]);

  const playNextVideo = useCallback(() => {
    const nextIndex = (currentVideoIndex + 1) % videos.length;
    setCurrentVideoIndex(nextIndex);
    setProgress(0);
    setIsLoading(true);
    setError(false);
  }, [currentVideoIndex, videos.length]);

  const playPreviousVideo = useCallback(() => {
    const previousIndex = currentVideoIndex === 0 ? videos.length - 1 : currentVideoIndex - 1;
    setCurrentVideoIndex(previousIndex);
    setProgress(0);
    setIsLoading(true);
    setError(false);
  }, [currentVideoIndex, videos.length]);

  const selectVideo = useCallback((index: number) => {
    if (index !== currentVideoIndex) {
      setCurrentVideoIndex(index);
      setProgress(0);
      setIsLoading(true);
      setError(false);
    }
  }, [currentVideoIndex]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      setIsLoading(true);
      video.play().catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  }, []);

  if (error) {
    return (
      <div className={`bg-gray-900 rounded-lg flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-white/80 mb-2">Error al cargar el video</div>
        <button
          onClick={playNextVideo}
          className="text-blue-400 hover:text-blue-300 underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-2 py-1"
          aria-label="Reproducir siguiente video"
        >
          Reproducir siguiente video
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className="relative bg-black rounded-lg overflow-hidden group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {isVisible && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted={isMuted}
            playsInline
            preload="metadata"
            poster={currentVideo.poster || '/posters/default-poster.jpg'}
            controlsList="nodownload noplaybackrate"
            onClick={togglePlay}
            aria-label={currentVideo.title}
          >
            <source src={currentVideo.src} type="video/mp4" />
            Tu navegador no soporta el elemento de video.
          </video>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" aria-label="Cargando video" />
          </div>
        )}

        {/* Video info overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <h3 className="text-white text-lg font-semibold">{currentVideo.title}</h3>
          {currentVideo.description && (
            <p className="text-white/80 text-sm mt-1">{currentVideo.description}</p>
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={playPreviousVideo}
          className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Video anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={playNextVideo}
          className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Siguiente video"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Video controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress bar */}
          <div 
            className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer"
            role="progressbar"
            aria-label="Progreso del video"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause button */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </button>

              {/* Skip to next */}
              <button
                onClick={playNextVideo}
                className="text-white hover:text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                aria-label="Siguiente video"
              >
                <SkipForward className="h-5 w-5" />
              </button>

              {/* Mute/Unmute button */}
              <button
                onClick={toggleMute}
                className="text-white hover:text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              {/* Current video indicator */}
              <span className="text-white text-sm hidden sm:block" aria-live="polite">
                {currentVideoIndex + 1} / {videos.length}
              </span>
            </div>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
              aria-label="Pantalla completa"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Play button overlay when paused */}
        {!isPlaying && !isLoading && isVisible && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 group-hover:bg-black/40"
            aria-label="Reproducir video"
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center transform transition-transform group-hover:scale-110">
              <Play className="h-8 w-8 text-gray-900 ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Video thumbnails */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2" role="tablist" aria-label="Selección de videos">
        {videos.map((video, index) => (
          <button
            key={index}
            onClick={() => selectVideo(index)}
            className={`flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden relative group hover:ring-2 hover:ring-primary-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              index === currentVideoIndex ? 'ring-2 ring-primary-500' : ''
            }`}
            role="tab"
            aria-selected={index === currentVideoIndex}
            aria-label={`Reproducir ${video.title}`}
          >
            {/* Use poster as thumbnail */}
            {video.poster && (
              <img 
                src={video.poster} 
                alt={`Vista previa de ${video.title}`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center hover:bg-black/70 transition-all">
              <span className="text-white text-xs px-2 text-center leading-tight">
                {video.title}
              </span>
            </div>
            {index === currentVideoIndex && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500">
                <div
                  className="h-full bg-primary-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoCarouselOptimized;