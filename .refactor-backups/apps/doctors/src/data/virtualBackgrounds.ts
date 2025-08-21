export interface VirtualBackground {
  id: string;
  name: string;
  category: 'medical' | 'office' | 'nature' | 'abstract' | 'gradient' | 'effect';
  url: string;
  thumbnail: string;
  description: string;
  tags: string[];
  recommended: boolean;
}

export const virtualBackgrounds: VirtualBackground[] = [
  // Fondos Médicos Profesionales
  {
    id: 'medical-office-blue',
    name: 'Consultorio Médico Azul',
    category: 'medical',
    url: '/api/placeholder/1920/1080?text=Consultorio+Azul&bg=1E40AF',
    thumbnail: '/api/placeholder/300/200?text=Consultorio+Azul&bg=1E40AF',
    description: 'Consultorio médico profesional con tonos azules relajantes',
    tags: ['médico', 'profesional', 'azul', 'consultorio'],
    recommended: true
  },
  {
    id: 'medical-office-white',
    name: 'Consultorio Blanco',
    category: 'medical',
    url: '/api/placeholder/1920/1080?text=Consultorio+Blanco&bg=FFFFFF',
    thumbnail: '/api/placeholder/300/200?text=Consultorio+Blanco&bg=FFFFFF',
    description: 'Consultorio limpio y minimalista en blanco',
    tags: ['médico', 'limpio', 'blanco', 'minimalista'],
    recommended: true
  },
  {
    id: 'hospital-room',
    name: 'Sala de Hospital',
    category: 'medical',
    url: '/api/placeholder/1920/1080?text=Sala+Hospital&bg=64748B',
    thumbnail: '/api/placeholder/300/200?text=Sala+Hospital&bg=64748B',
    description: 'Sala de hospital moderna y equipada',
    tags: ['hospital', 'sala', 'equipamiento', 'moderno'],
    recommended: false
  },
  {
    id: 'medical-lab',
    name: 'Laboratorio Médico',
    category: 'medical',
    url: '/api/placeholder/1920/1080?text=Laboratorio&bg=0F172A',
    thumbnail: '/api/placeholder/300/200?text=Laboratorio&bg=0F172A',
    description: 'Laboratorio médico con equipos científicos',
    tags: ['laboratorio', 'científico', 'equipos', 'investigación'],
    recommended: false
  },
  {
    id: 'pharmacy',
    name: 'Farmacia',
    category: 'medical',
    url: '/api/placeholder/1920/1080?text=Farmacia&bg=7C3AED',
    thumbnail: '/api/placeholder/300/200?text=Farmacia&bg=7C3AED',
    description: 'Farmacia moderna con estantes de medicamentos',
    tags: ['farmacia', 'medicamentos', 'púrpura', 'estantes'],
    recommended: false
  },

  // Fondos de Oficina
  {
    id: 'office-modern',
    name: 'Oficina Moderna',
    category: 'office',
    url: '/api/placeholder/1920/1080?text=Oficina+Moderna&bg=374151',
    thumbnail: '/api/placeholder/300/200?text=Oficina+Moderna&bg=374151',
    description: 'Oficina moderna con diseño contemporáneo',
    tags: ['oficina', 'moderna', 'profesional', 'contemporáneo'],
    recommended: true
  },
  {
    id: 'office-warm',
    name: 'Oficina Cálida',
    category: 'office',
    url: '/api/placeholder/1920/1080?text=Oficina+Cálida&bg=D97706',
    thumbnail: '/api/placeholder/300/200?text=Oficina+Cálida&bg=D97706',
    description: 'Oficina con tonos cálidos y acogedores',
    tags: ['oficina', 'cálida', 'acogedora', 'madera'],
    recommended: false
  },
  {
    id: 'home-office',
    name: 'Oficina en Casa',
    category: 'office',
    url: '/api/placeholder/1920/1080?text=Oficina+Casa&bg=059669',
    thumbnail: '/api/placeholder/300/200?text=Oficina+Casa&bg=059669',
    description: 'Oficina doméstica confortable',
    tags: ['casa', 'doméstico', 'confortable', 'verde'],
    recommended: true
  },

  // Fondos de Naturaleza
  {
    id: 'nature-forest',
    name: 'Bosque Tranquilo',
    category: 'nature',
    url: '/api/placeholder/1920/1080?text=Bosque&bg=166534',
    thumbnail: '/api/placeholder/300/200?text=Bosque&bg=166534',
    description: 'Bosque verde relajante',
    tags: ['naturaleza', 'bosque', 'verde', 'tranquilo'],
    recommended: true
  },
  {
    id: 'nature-ocean',
    name: 'Océano Azul',
    category: 'nature',
    url: '/api/placeholder/1920/1080?text=Océano&bg=0EA5E9',
    thumbnail: '/api/placeholder/300/200?text=Océano&bg=0EA5E9',
    description: 'Vista al océano azul',
    tags: ['naturaleza', 'océano', 'azul', 'calmante'],
    recommended: false
  },
  {
    id: 'nature-mountain',
    name: 'Montañas',
    category: 'nature',
    url: '/api/placeholder/1920/1080?text=Montañas&bg=6B7280',
    thumbnail: '/api/placeholder/300/200?text=Montañas&bg=6B7280',
    description: 'Paisaje montañoso sereno',
    tags: ['naturaleza', 'montañas', 'gris', 'sereno'],
    recommended: false
  },

  // Fondos Abstractos
  {
    id: 'abstract-geometric',
    name: 'Geométrico',
    category: 'abstract',
    url: '/api/placeholder/1920/1080?text=Geométrico&bg=8B5CF6',
    thumbnail: '/api/placeholder/300/200?text=Geométrico&bg=8B5CF6',
    description: 'Diseño geométrico moderno',
    tags: ['abstracto', 'geométrico', 'moderno', 'púrpura'],
    recommended: false
  },
  {
    id: 'abstract-minimal',
    name: 'Minimalista',
    category: 'abstract',
    url: '/api/placeholder/1920/1080?text=Minimalista&bg=F3F4F6',
    thumbnail: '/api/placeholder/300/200?text=Minimalista&bg=F3F4F6',
    description: 'Diseño minimalista elegante',
    tags: ['abstracto', 'minimalista', 'elegante', 'gris'],
    recommended: true
  },

  // Gradientes
  {
    id: 'gradient-blue-purple',
    name: 'Gradiente Azul-Púrpura',
    category: 'gradient',
    url: '/api/placeholder/1920/1080?text=Gradiente+Azul-Púrpura&bg=3B82F6&bg2=8B5CF6',
    thumbnail: '/api/placeholder/300/200?text=Gradiente+Azul-Púrpura&bg=3B82F6&bg2=8B5CF6',
    description: 'Gradiente suave de azul a púrpura',
    tags: ['gradiente', 'azul', 'púrpura', 'suave'],
    recommended: true
  },
  {
    id: 'gradient-green-blue',
    name: 'Gradiente Verde-Azul',
    category: 'gradient',
    url: '/api/placeholder/1920/1080?text=Gradiente+Verde-Azul&bg=10B981&bg2=3B82F6',
    thumbnail: '/api/placeholder/300/200?text=Gradiente+Verde-Azul&bg=10B981&bg2=3B82F6',
    description: 'Gradiente natural de verde a azul',
    tags: ['gradiente', 'verde', 'azul', 'natural'],
    recommended: false
  },
  {
    id: 'gradient-warm',
    name: 'Gradiente Cálido',
    category: 'gradient',
    url: '/api/placeholder/1920/1080?text=Gradiente+Cálido&bg=F59E0B&bg2=EF4444',
    thumbnail: '/api/placeholder/300/200?text=Gradiente+Cálido&bg=F59E0B&bg2=EF4444',
    description: 'Gradiente cálido de naranja a rojo',
    tags: ['gradiente', 'cálido', 'naranja', 'rojo'],
    recommended: false
  },

  // Efectos Especiales
  {
    id: 'effect-blur',
    name: 'Desenfoque',
    category: 'effect',
    url: 'blur',
    thumbnail: '/api/placeholder/300/200?text=Desenfoque&bg=6B7280',
    description: 'Efecto de desenfoque del fondo real',
    tags: ['efecto', 'desenfoque', 'real', 'natural'],
    recommended: true
  },
  {
    id: 'effect-vintage',
    name: 'Vintage',
    category: 'effect',
    url: 'vintage',
    thumbnail: '/api/placeholder/300/200?text=Vintage&bg=92400E',
    description: 'Efecto vintage con tonos sepia',
    tags: ['efecto', 'vintage', 'sepia', 'retro'],
    recommended: false
  },
  {
    id: 'effect-bw',
    name: 'Blanco y Negro',
    category: 'effect',
    url: 'bw',
    thumbnail: '/api/placeholder/300/200?text=ByN&bg=000000',
    description: 'Efecto monocromático',
    tags: ['efecto', 'monocromático', 'elegante', 'clásico'],
    recommended: false
  }
];

// Función para obtener fondos por categoría
export const getBackgroundsByCategory = (category: string) => {
  return virtualBackgrounds.filter(bg => bg.category === category);
};

// Función para obtener fondos recomendados
export const getRecommendedBackgrounds = () => {
  return virtualBackgrounds.filter(bg => bg.recommended);
};

// Función para buscar fondos por tags
export const searchBackgrounds = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return virtualBackgrounds.filter(bg => 
    bg.name.toLowerCase().includes(lowercaseQuery) ||
    bg.description.toLowerCase().includes(lowercaseQuery) ||
    bg.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}; 