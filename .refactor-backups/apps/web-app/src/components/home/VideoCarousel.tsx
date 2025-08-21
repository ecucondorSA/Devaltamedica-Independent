// TODO(MIGRATION): Evaluar mover este componente a un paquete compartido (@altamedica/media) o simplificarlo para marketing.
'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { ChevronLeft, ChevronRight, Loader2, Maximize, Pause, Play, SkipForward, Volume2, VolumeX } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export interface Video {
  src: string;
  title: string;
  description?: string;
}

export interface VideoCarouselProps {
  videos: Video[];
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
}

const VideoCarousel: React.FC<VideoCarouselProps> = ({
  videos = [
    {
      src: "/Video_Listo_.mp4",
      title: "Introducción a AltaMedica",
      description: "Conoce nuestra plataforma médica digital"
    },
    {
      src: "/Video_Listo_Encuentra_Doctor.mp4",
      title: "Encuentra tu Doctor",
      description: "Busca especialistas cerca de ti"
    },
    {
      src: "/Video_Listo_Telemedicina.mp4",
      title: "Telemedicina 24/7",
      description: "Consultas médicas desde cualquier lugar"
    }
  ],
  autoPlay = true,
  muted = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  // Verificación de seguridad
  if (!videos || videos.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-lg p-8">
        <p className="text-neutral-500">No hay videos disponibles</p>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const handleLoadedData = () => {
      setIsLoading(false);
      if (autoPlay) {
        video.play().catch(() => {
          // Auto-play might be blocked
          setIsPlaying(false);
        });
      }
    };

    const handleError = () => {
      setError(true);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handleEnded = () => {
      // Automatically play next video when current one ends
      playNextVideo();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // Load the video
    video.load();

  return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideoIndex, autoPlay]);

  const playNextVideo = () => {
    const nextIndex = (currentVideoIndex + 1) % videos.length;
    setCurrentVideoIndex(nextIndex);
    setProgress(0);
    setIsLoading(true);
    setError(false);
  };

  const playPreviousVideo = () => {
    const previousIndex = currentVideoIndex === 0 ? videos.length - 1 : currentVideoIndex - 1;
    setCurrentVideoIndex(previousIndex);
    setProgress(0);
    setIsLoading(true);
    setError(false);
  };

  const selectVideo = (index: number) => {
    if (index !== currentVideoIndex) {
      setCurrentVideoIndex(index);
      setProgress(0);
      setIsLoading(true);
      setError(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  if (error) {
    return (
      <div className={`bg-gray-900 rounded-lg flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-white/80 mb-2">Error al cargar el video</div>
        <button
          onClick={() => playNextVideo()}
          className="text-blue-400 hover:text-blue-300 underline text-sm"
        >
          Reproducir siguiente video
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        className="relative bg-black rounded-lg overflow-hidden group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay={autoPlay}
          muted={isMuted}
          playsInline
          onClick={togglePlay}
          aria-label={currentVideo.title}
        >
          <source src={currentVideo.src} type="video/mp4" />
          Tu navegador no soporta el elemento de video.
        </video>

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        {/* Video info overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <h3 className="text-white text-lg font-semibold">{currentVideo.title}</h3>
          {currentVideo.description && (
            <p className="text-white/80 text-sm mt-1">{currentVideo.description}</p>
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={playPreviousVideo}
          className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Video anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={playNextVideo}
          className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all ${
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
          <div className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer">
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
                className="text-white hover:text-white/80 transition-colors"
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
                className="text-white hover:text-white/80 transition-colors"
                aria-label="Siguiente video"
              >
                <SkipForward className="h-5 w-5" />
              </button>

              {/* Mute/Unmute button */}
              <button
                onClick={toggleMute}
                className="text-white hover:text-white/80 transition-colors"
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              {/* Current video indicator */}
              <span className="text-white text-sm hidden sm:block">
                {currentVideoIndex + 1} / {videos.length}
              </span>
            </div>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-white/80 transition-colors"
              aria-label="Pantalla completa"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Play button overlay when paused */}
        {!isPlaying && !isLoading && (
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
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {videos.map((video, index) => (
          <button
            key={index}
            onClick={() => selectVideo(index)}
            className={`flex-shrink-0 w-32 h-20 video-carousel-thumbnail rounded-lg overflow-hidden relative group hover:ring-2 hover:ring-primary-400 transition-all ${
              index === currentVideoIndex ? 'ring-2 ring-primary-500' : ''
            }`}
            aria-label={`Reproducir ${video.title}`}
          >
            <div className="absolute inset-0 video-carousel-overlay flex items-center justify-center hover:bg-opacity-85 transition-all">
              <span className="video-carousel-text text-xs px-2 text-center leading-tight">
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

export default VideoCarousel;