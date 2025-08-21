/**
 * VideoCard.tsx - Componente para Videos Explicativos
 * Proyecto: Altamedica Pacientes
 * Diseño: Componente corporativo para videos educativos
 */

"use client";

import React, { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Heart, Share2 } from "lucide-react";
import { CardCorporate, CardContentCorporate } from "./CardCorporate";
import { ButtonCorporate } from "./ButtonCorporate";

interface VideoCardProps {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: string;
  category: "salud" | "citas" | "telemedicina" | "historial" | "medicamentos";
  isFavorite?: boolean;
  onFavorite?: () => void;
  onShare?: () => void;
  className?: string;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  title,
  description,
  videoUrl,
  thumbnailUrl,
  duration,
  category,
  isFavorite = false,
  onFavorite,
  onShare,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const categoryColors = {
    salud: "bg-green-100 text-green-800 border-green-200",
    citas: "bg-blue-100 text-blue-800 border-blue-200",
    telemedicina: "bg-purple-100 text-purple-800 border-purple-200",
    historial: "bg-orange-100 text-orange-800 border-orange-200",
    medicamentos: "bg-red-100 text-red-800 border-red-200",
  };

  const categoryIcons = {
    salud: "🏥",
    citas: "📅",
    telemedicina: "📹",
    historial: "📋",
    medicamentos: "💊",
  };

  const handlePlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef) {
      videoRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef) {
      if (!isFullscreen) {
        videoRef.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <CardCorporate variant="default" size="md" className={`overflow-hidden ${className}`}>
      <CardContentCorporate className="p-0">
        {/* Video Container */}
        <div className="relative bg-black rounded-t-lg">
          <video
            ref={setVideoRef}
            className="w-full h-48 object-cover"
            poster={thumbnailUrl}
            onEnded={handleVideoEnded}
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            Tu navegador no soporta videos.
          </video>

          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <ButtonCorporate
              variant="ghost"
              size="lg"
              onClick={handlePlayPause}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </ButtonCorporate>
          </div>

          {/* Video Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <ButtonCorporate
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </ButtonCorporate>
                
                <ButtonCorporate
                  variant="ghost"
                  size="sm"
                  onClick={handleMute}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </ButtonCorporate>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs">{duration}</span>
                <ButtonCorporate
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreen}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Maximize2 className="w-4 h-4" />
                </ButtonCorporate>
              </div>
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${categoryColors[category]}`}>
              {categoryIcons[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center space-x-1 ml-2">
              {onFavorite && (
                <ButtonCorporate
                  variant="ghost"
                  size="sm"
                  onClick={onFavorite}
                  className={`p-1 ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </ButtonCorporate>
              )}
              {onShare && (
                <ButtonCorporate
                  variant="ghost"
                  size="sm"
                  onClick={onShare}
                  className="p-1 text-gray-400 hover:text-blue-500"
                >
                  <Share2 className="w-4 h-4" />
                </ButtonCorporate>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
            {description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Altamedica • Video educativo</span>
            <span>HD • Subtítulos disponibles</span>
          </div>
        </div>
      </CardContentCorporate>
    </CardCorporate>
  );
}; 