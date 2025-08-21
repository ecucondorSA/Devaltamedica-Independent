"use client";

import { useEffect, useRef, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
export function useLeafletMap() {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  // Limpiar mapa existente
  const cleanupMap = () => {
    if (mapRef.current) {
      try {
        const map = mapRef.current;
        
        // Remover todos los event listeners
        map.off();
        
        // Limpiar layers
        map.eachLayer((layer: any) => {
          map.removeLayer(layer);
        });
        
        // Remover mapa
        map.remove();
        mapRef.current = null;
      } catch (error) {
        logger.warn('Error al limpiar mapa:', error);
      }
    }
  };

  // Limpiar contenedor DOM
  const cleanupContainer = () => {
    if (containerRef.current) {
      // Buscar y limpiar contenedores de Leaflet existentes
      const leafletContainers = containerRef.current.querySelectorAll('.leaflet-container');
      leafletContainers.forEach((container) => {
        try {
          // Remover ID de Leaflet si existe
          if ((container as any)._leaflet_id) {
            delete (container as any)._leaflet_id;
          }
          
          // Limpiar contenido
          container.innerHTML = '';
          container.remove();
        } catch (error) {
          logger.warn('Error al limpiar contenedor:', error);
        }
      });
      
      // Limpiar contenido completo del contenedor
      containerRef.current.innerHTML = '';
    }
  };

  // Reinicializar mapa en caso de error
  const reinitializeMap = () => {
    cleanupMap();
    cleanupContainer();
    setMapKey(prev => prev + 1);
    setIsInitialized(false);
    
    // Reinicializar después de un pequeño delay
    setTimeout(() => {
      setIsInitialized(true);
    }, 100);
  };

  // Effect para inicialización de Leaflet - optimizado para importación dinámica
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      // Dar tiempo para que se carguen los componentes dinámicos
      const initTimer = setTimeout(() => {
        const L = (window as any).L;
        if (L) {
          // Configurar iconos por defecto
          try {
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });
          } catch (error) {
            logger.warn('Error al configurar iconos de Leaflet:', error);
          }
        }
        
        // Inicializar incluso si L no está disponible (para componentes dinámicos)
        setIsInitialized(true);
      }, 150);
      
      return () => clearTimeout(initTimer);
    }
  }, [isInitialized]);

  // Effect para detectar errores de inicialización duplicada
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Map container is already initialized')) {
        logger.warn('Error de mapa duplicado detectado, reinicializando...');
        event.preventDefault();
        reinitializeMap();
      }
    };

    // Agregar listener global para errores
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Cleanup principal
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, []);

  // Callback para cuando se crea el mapa
  const onMapCreated = (mapInstance: any) => {
    mapRef.current = mapInstance;
  };

  return {
    mapRef,
    containerRef,
    isInitialized,
    mapKey,
    onMapCreated,
    reinitializeMap,
    cleanupMap,
  };
}