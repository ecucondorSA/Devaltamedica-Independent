import { Button, Card, Input } from '@altamedica/ui';
import React, { useState } from 'react';
import { Image, Palette, X, Check, Search, Settings, Zap, Star } from 'lucide-react';
import { virtualBackgrounds, VirtualBackground, getBackgroundsByCategory, getRecommendedBackgrounds, searchBackgrounds } from '@/data/virtualBackgrounds';
import { videoEffects, getEffectById } from '@/utils/videoEffects';

interface VirtualBackgroundControlsProps {
  isVirtualBackground: boolean;
  onToggle: (enabled: boolean) => void;
  onSelectBackground: (imageUrl: string) => void;
  processingQuality?: 'low' | 'medium' | 'high';
  onQualityChange?: (quality: 'low' | 'medium' | 'high') => void;
  selectedEffect?: string;
  onEffectChange?: (effectId: string) => void;
}

export const VirtualBackgroundControls: React.FC<VirtualBackgroundControlsProps> = ({
  isVirtualBackground,
  onToggle,
  onSelectBackground,
  processingQuality = 'medium',
  onQualityChange,
  selectedEffect,
  onEffectChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'backgrounds' | 'effects' | 'settings'>('backgrounds');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'Todos', icon: '🎨' },
    { id: 'medical', name: 'Médicos', icon: '🏥' },
    { id: 'office', name: 'Oficina', icon: '🏢' },
    { id: 'nature', name: 'Naturaleza', icon: '🌿' },
    { id: 'abstract', name: 'Abstractos', icon: '✨' },
    { id: 'gradient', name: 'Gradientes', icon: '🌈' },
    { id: 'effect', name: 'Efectos', icon: '🎭' }
  ];

  const filteredBackgrounds = selectedCategory === 'all' 
    ? virtualBackgrounds 
    : getBackgroundsByCategory(selectedCategory);

  const searchResults = searchQuery 
    ? searchBackgrounds(searchQuery)
    : filteredBackgrounds;

  const recommendedBackgrounds = getRecommendedBackgrounds();

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'high': return <Zap className="w-4 h-4 text-green-500" />;
      case 'medium': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Zap className="w-4 h-4 text-red-500" />;
      default: return <Zap className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-lg transition-colors ${
          isVirtualBackground 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="Fondo Virtual"
      >
        <Palette className="w-5 h-5" />
      </button>

      {/* Panel de opciones */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-96 z-50 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Fondo Virtual</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle principal */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-700">Activar fondo virtual</span>
            <button
              onClick={() => onToggle(!isVirtualBackground)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isVirtualBackground ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isVirtualBackground ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('backgrounds')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'backgrounds' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Fondos
            </button>
            <button
              onClick={() => setActiveTab('effects')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'effects' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Efectos
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'settings' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Contenido de tabs */}
          <div className="max-h-64 overflow-y-auto">
            {activeTab === 'backgrounds' && (
              <div className="space-y-4">
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar fondos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Categorías */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>

                {/* Fondos recomendados */}
                {!searchQuery && selectedCategory === 'all' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      Recomendados
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {recommendedBackgrounds.slice(0, 4).map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => {
                            onSelectBackground(bg.url);
                            setIsOpen(false);
                          }}
                          className="group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
                        >
                          <div 
                            className="h-16 w-full flex items-center justify-center text-white font-medium text-xs"
                            style={{ backgroundColor: bg.url.includes('bg=') ? `#${bg.url.split('bg=')[1]?.split('&')[0]}` : '#6B7280' }}
                          >
                            {bg.name}
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <Check className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de fondos */}
                <div className="grid grid-cols-2 gap-2">
                  {searchResults.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        onSelectBackground(bg.url);
                        setIsOpen(false);
                      }}
                      className="group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
                    >
                      <div 
                        className="h-16 w-full flex items-center justify-center text-white font-medium text-xs"
                        style={{ backgroundColor: bg.url.includes('bg=') ? `#${bg.url.split('bg=')[1]?.split('&')[0]}` : '#6B7280' }}
                      >
                        {bg.name}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <Check className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'effects' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Efectos de Video</h4>
                <div className="grid grid-cols-2 gap-2">
                  {videoEffects.map((effect) => (
                    <button
                      key={effect.id}
                      onClick={() => {
                        onEffectChange?.(effect.id);
                        setIsOpen(false);
                      }}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedEffect === effect.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">{effect.name}</div>
                      <div className="text-xs text-gray-500">{effect.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Configuración de Rendimiento</h4>
                
                {/* Calidad de procesamiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calidad de Procesamiento
                  </label>
                  <div className="space-y-2">
                    {(['low', 'medium', 'high'] as const).map((quality) => (
                      <label key={quality} className="flex items-center">
                        <input
                          type="radio"
                          name="quality"
                          value={quality}
                          checked={processingQuality === quality}
                          onChange={() => onQualityChange?.(quality)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {getQualityIcon(quality)} {quality}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Información de rendimiento */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-blue-900 mb-1">Información</h5>
                  <p className="text-xs text-blue-800">
                    💡 Para mejores resultados, usa un fondo verde uniforme y buena iluminación.
                    La calidad alta consume más CPU pero ofrece mejor detección.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 