/**
 * 🏥 UNIFIED ANAMNESIS HOOK
 * 
 * Hook consolidado para gestión de anamnesis médica
 * Combina funcionalidad de múltiples hooks duplicados:
 * - apps/patients/src/hooks/useAnamnesis.ts
 * - apps/web-app/src/hooks/useAnamnesis.ts
 */

import { useAuth } from '@altamedica/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AnamnesisData,
  EscenaAnamnesis,
  Logro,
  PreguntaAnamnesis,
  ProgresoAnamnesis,
  RespuestaAnamnesis,
  SeccionAnamnesis
} from '../types/anamnesis.types';

export interface UseAnamnesisOptions {
  patientId?: string;
  autoSave?: boolean;
  mode?: 'professional' | 'interactive' | 'gamified';
  secciones?: SeccionAnamnesis[];
  escenas?: Record<string, EscenaAnamnesis>;
  onCompletado?: (progreso: ProgresoAnamnesis) => void;
  onSave?: (data: Partial<AnamnesisData>) => void;
}

export interface UseAnamnesisReturn {
  // Estado principal
  anamnesis: AnamnesisData | null;
  loading: boolean;
  error: string | null;
  
  // Progreso y navegación
  progreso: ProgresoAnamnesis;
  seccionActual: SeccionAnamnesis | null;
  preguntaActual: PreguntaAnamnesis | null;
  escenaActual: EscenaAnamnesis | null;
  
  // Métricas y análisis
  hasAnamnesis: boolean;
  anamnesisQuality: number;
  urgencyLevel: string;
  alerts: string[];
  recommendations: string[];
  completionPercentage: number;
  
  // Gamificación
  logrosNuevos: Logro[];
  points: number;
  
  // Acciones
  refresh: () => Promise<void>;
  saveAnamnesis: (data?: Partial<AnamnesisData>) => Promise<void>;
  responderPregunta: (preguntaId: string, valor: any) => void;
  siguientePregunta: () => void;
  preguntaAnterior: () => void;
  irASeccion: (seccionIndex: number) => void;
  importFromGame: (respuestasJuego: Record<string, any>) => Promise<void>;
  resetAnamnesis: () => void;
}

export function useAnamnesis(options: UseAnamnesisOptions = {}): UseAnamnesisReturn {
  const {
    patientId,
    autoSave = true,
    mode = 'professional',
    secciones = [],
    escenas = {},
    onCompletado,
    onSave
  } = options;

  const auth = useAuth();
  const [anamnesis, setAnamnesis] = useState<AnamnesisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<ProgresoAnamnesis>({
    seccionActual: 0,
    preguntaActual: 0,
    respuestas: {},
    puntosAcumulados: 0,
    logrosObtenidos: [],
    tiempoTotal: 0,
    nivelCompletitud: 0
  });
  const [logrosNuevos, setLogrosNuevos] = useState<Logro[]>([]);
  const [points, setPoints] = useState(0);
  const [tiempoInicio] = useState(Date.now());

  const id = patientId || (auth?.user as any)?.id;

  // Calcular sección y pregunta actual
  const seccionActual = useMemo(() => 
    secciones[progreso.seccionActual] || null,
    [secciones, progreso.seccionActual]
  );

  const preguntaActual = useMemo(() => 
    seccionActual?.preguntas?.[progreso.preguntaActual] || null,
    [seccionActual, progreso.preguntaActual]
  );

  const escenaActual = useMemo(() => 
    seccionActual ? escenas[seccionActual.id] : null,
    [seccionActual, escenas]
  );

  // Calcular porcentaje de completitud
  const completionPercentage = useMemo(() => {
    if (!secciones.length) return 0;
    
    const totalPreguntas = secciones.reduce(
      (total, seccion) => total + (seccion.preguntas?.length || 0),
      0
    );
    
    const preguntasRespondidas = Object.keys(progreso.respuestas).length;
    
    return totalPreguntas > 0 
      ? Math.round((preguntasRespondidas / totalPreguntas) * 100)
      : 0;
  }, [secciones, progreso.respuestas]);

  // Calcular calidad de anamnesis
  const anamnesisQuality = useMemo(() => {
    const respuestasCompletas = Object.values(progreso.respuestas).filter(
      respuesta => respuesta && respuesta.valor
    ).length;
    
    const totalRespuestas = Object.keys(progreso.respuestas).length;
    
    if (totalRespuestas === 0) return 0;
    
    return Math.round((respuestasCompletas / totalRespuestas) * 100);
  }, [progreso.respuestas]);

  // Determinar nivel de urgencia
  const urgencyLevel = useMemo(() => {
    // Lógica simplificada - expandir según necesidades médicas
    const respuestasSintomas = Object.values(progreso.respuestas).filter(
      r => r?.tipo === 'sintoma'
    );
    
    if (respuestasSintomas.some(r => r?.urgente)) return 'HIGH';
    if (respuestasSintomas.length > 3) return 'MEDIUM';
    return 'LOW';
  }, [progreso.respuestas]);

  // Generar alertas y recomendaciones
  const alerts = useMemo(() => {
    const alertList: string[] = [];
    
    if (urgencyLevel === 'HIGH') {
      alertList.push('Síntomas urgentes detectados - Consulte inmediatamente');
    }
    
    if (completionPercentage < 50 && Object.keys(progreso.respuestas).length > 0) {
      alertList.push('Anamnesis incompleta - Complete más información');
    }
    
    return alertList;
  }, [urgencyLevel, completionPercentage, progreso.respuestas]);

  const recommendations = useMemo(() => {
    const recs: string[] = [];
    
    if (completionPercentage === 100) {
      recs.push('Anamnesis completa - Puede proceder con la consulta');
    }
    
    if (mode === 'gamified' && points > 100) {
      recs.push('¡Excelente progreso! Has ganado puntos bonus');
    }
    
    return recs;
  }, [completionPercentage, mode, points]);

  // Cargar anamnesis
  const loadAnamnesis = useCallback(async () => {
  if (!id || !(auth as any)?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Simulación - reemplazar con llamada real a API
      const response = await fetch(`/api/v1/anamnesis/${id}`, {
        headers: {
          'Authorization': `Bearer ${(auth as any).token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnamnesis(data);
        
        // Restaurar progreso si existe
        if (data.progreso) {
          setProgreso(data.progreso);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading anamnesis');
    } finally {
      setLoading(false);
    }
  }, [id, (auth as any)?.token]);

  // Guardar anamnesis
  const saveAnamnesis = useCallback(async (data?: Partial<AnamnesisData>) => {
  if (!id || !(auth as any)?.token) return;

    try {
      const dataToSave = data || {
        patientId: id,
        sections: progreso.respuestas,
        progress: completionPercentage,
        mode
      };

    const response = await fetch(`/api/v1/anamnesis/${id}`, {
        method: 'PUT',
        headers: {
      'Authorization': `Bearer ${(auth as any).token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setAnamnesis(updatedData);
        
        if (onSave) {
          onSave(dataToSave);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving anamnesis');
    }
  }, [id, (auth as any)?.token, progreso, completionPercentage, mode, onSave]);

  // Responder pregunta
  const responderPregunta = useCallback((preguntaId: string, valor: any) => {
    setProgreso(prev => ({
      ...prev,
      respuestas: {
        ...prev.respuestas,
        [preguntaId]: ({
          preguntaId,
          valor,
          respuesta: valor,
          timestamp: new Date(),
          tipo: (preguntaActual as any)?.type || 'text'
        } as unknown) as RespuestaAnamnesis
      }
    }));

    // Auto-guardar si está habilitado
    if (autoSave) {
      saveAnamnesis();
    }

    // Actualizar puntos en modo gamificado
    if (mode === 'gamified') {
      setPoints(prev => prev + 10);
    }
  }, [preguntaActual, autoSave, saveAnamnesis, mode]);

  // Navegación
  const siguientePregunta = useCallback(() => {
    setProgreso(prev => {
      const seccionActual = secciones[prev.seccionActual];
      const totalPreguntas = seccionActual?.preguntas?.length || 0;
      
      if (prev.preguntaActual < totalPreguntas - 1) {
        return { ...prev, preguntaActual: prev.preguntaActual + 1 };
      } else if (prev.seccionActual < secciones.length - 1) {
        return {
          ...prev,
          seccionActual: prev.seccionActual + 1,
          preguntaActual: 0
        };
      }
      
      // Llegó al final
      if (onCompletado) {
        onCompletado(prev);
      }
      
      return prev;
    });
  }, [secciones, onCompletado]);

  const preguntaAnterior = useCallback(() => {
    setProgreso(prev => {
      if (prev.preguntaActual > 0) {
        return { ...prev, preguntaActual: prev.preguntaActual - 1 };
      } else if (prev.seccionActual > 0) {
        const seccionAnterior = secciones[prev.seccionActual - 1];
        const ultimaPregunta = (seccionAnterior?.preguntas?.length || 1) - 1;
        
        return {
          ...prev,
          seccionActual: prev.seccionActual - 1,
          preguntaActual: ultimaPregunta
        };
      }
      
      return prev;
    });
  }, [secciones]);

  const irASeccion = useCallback((seccionIndex: number) => {
    if (seccionIndex >= 0 && seccionIndex < secciones.length) {
      setProgreso(prev => ({
        ...prev,
        seccionActual: seccionIndex,
        preguntaActual: 0
      }));
    }
  }, [secciones]);

  // Importar desde juego
  const importFromGame = useCallback(async (respuestasJuego: Record<string, any>) => {
    // Convertir respuestas del juego al formato de anamnesis
    const respuestasConvertidas: Record<string, RespuestaAnamnesis> = {};
    
    Object.entries(respuestasJuego).forEach(([key, value]) => {
      respuestasConvertidas[key] = ({
        preguntaId: key,
        valor: value,
        respuesta: value,
        timestamp: new Date(),
        tipo: 'imported'
      } as unknown) as RespuestaAnamnesis;
    });
    
    setProgreso(prev => ({
      ...prev,
      respuestas: {
        ...prev.respuestas,
        ...respuestasConvertidas
      }
    }));
    
    await saveAnamnesis();
  }, [saveAnamnesis]);

  // Reset anamnesis
  const resetAnamnesis = useCallback(() => {
    setAnamnesis(null);
    setProgreso({
      seccionActual: 0,
      preguntaActual: 0,
      respuestas: {},
      puntosAcumulados: 0,
      logrosObtenidos: [],
      tiempoTotal: 0,
      nivelCompletitud: 0
    });
    setLogrosNuevos([]);
    setPoints(0);
    setError(null);
  }, []);

  // Efectos
  useEffect(() => {
    loadAnamnesis();
  }, [loadAnamnesis]);

  // Actualizar tiempo total
  useEffect(() => {
    const interval = setInterval(() => {
      setProgreso(prev => ({
        ...prev,
        tiempoTotal: Math.floor((Date.now() - tiempoInicio) / 1000)
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [tiempoInicio]);

  return {
    // Estado principal
    anamnesis,
    loading,
    error,
    
    // Progreso y navegación
    progreso,
    seccionActual,
    preguntaActual,
    escenaActual,
    
    // Métricas
    hasAnamnesis: !!anamnesis,
    anamnesisQuality,
    urgencyLevel,
    alerts,
    recommendations,
    completionPercentage,
    
    // Gamificación
    logrosNuevos,
    points,
    
    // Acciones
    refresh: loadAnamnesis,
    saveAnamnesis,
    responderPregunta,
    siguientePregunta,
    preguntaAnterior,
    irASeccion,
    importFromGame,
    resetAnamnesis
  };
}

export default useAnamnesis;