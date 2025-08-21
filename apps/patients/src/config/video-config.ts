/**
 * video-config.ts - Configuración de Videos Explicativos
 * Proyecto: Altamedica Pacientes
 * Descripción: Configuración centralizada para videos del dashboard
 */

export interface VideoConfig {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: string;
  category: "salud" | "citas" | "telemedicina" | "historial" | "medicamentos";
  isFavorite?: boolean;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 🎥 Videos explicativos de Altamedica
export const EXPLANATORY_VIDEOS: VideoConfig[] = [
  {
    id: "portal-guide",
    title: "Cómo usar tu portal de paciente",
    description: "Video explicativo sobre cómo usar tu portal de paciente",
    videoUrl: "/videos/portal-guide.mp4",
    thumbnailUrl: "/images/video-thumbnails/portal-guide.jpg",
    duration: "3:45",
    category: "salud" as const,
    isFavorite: false,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "appointment-booking",
    title: "Agendar citas médicas online",
    description: "Video explicativo sobre agendar citas médicas online",
    videoUrl: "/videos/appointment-booking.mp4",
    thumbnailUrl: "/images/video-thumbnails/appointment-booking.jpg",
    duration: "2:30",
    category: "citas" as const,
    isFavorite: false,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "telemedicine-guide",
    title: "Tu primera consulta de telemedicina",
    description: "Video explicativo sobre tu primera consulta de telemedicina",
    videoUrl: "/videos/telemedicine-guide.mp4",
    thumbnailUrl: "/images/video-thumbnails/telemedicine-guide.jpg",
    duration: "4:15",
    category: "telemedicina" as const,
    isFavorite: false,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "medical-history",
    title: "Entendiendo tu historial médico",
    description: "Video explicativo sobre entendiendo tu historial médico",
    videoUrl: "/videos/medical-history.mp4",
    thumbnailUrl: "/images/video-thumbnails/medical-history.jpg",
    duration: "3:20",
    category: "historial" as const,
    isFavorite: false,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// 🎯 Categorías de videos disponibles
export const VIDEO_CATEGORIES = [
  "salud",
  "citas", 
  "telemedicina",
  "historial",
  "medicamentos"
] as const;

// 📊 Estadísticas de videos
export const VIDEO_STATS = {
  totalVideos: 4,
  categories: ["salud","citas","telemedicina","historial"],
  totalDuration: "830",
  averageDuration: "208",
};

// 🔍 Función para obtener videos por categoría
export const getVideosByCategory = (category: string): VideoConfig[] => {
  return EXPLANATORY_VIDEOS.filter(video => video.category === category);
};

// ⭐ Función para obtener videos favoritos
export const getFavoriteVideos = (): VideoConfig[] => {
  return EXPLANATORY_VIDEOS.filter(video => video.isFavorite);
};

// 📈 Función para obtener videos más vistos
export const getMostViewedVideos = (limit: number = 5): VideoConfig[] => {
  return EXPLANATORY_VIDEOS
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);
};

// 🆕 Función para obtener videos recientes
export const getRecentVideos = (limit: number = 5): VideoConfig[] => {
  return EXPLANATORY_VIDEOS
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, limit);
};
