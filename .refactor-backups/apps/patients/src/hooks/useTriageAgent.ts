import { triageAgent, type Symptom, type TriageResult } from '@/services/triage-agent.service';
import { useAuth  } from '@altamedica/auth';;
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
interface UseTriageAgentOptions {
  autoLog?: boolean;
  onSuccess?: (result: TriageResult) => void;
  onError?: (error: Error) => void;
}

export function useTriageAgent(options: UseTriageAgentOptions = {}) {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState<TriageResult | null>(null);

  // Mutation para evaluar síntomas
  const evaluateMutation = useMutation({
    mutationFn: async (symptomsToEvaluate: Symptom[]) => {
      setIsEvaluating(true);
      const result = await triageAgent.evaluateSymptoms(symptomsToEvaluate);

      // Log automático si está habilitado
      if (options.autoLog && user?.id) {
        await triageAgent.logTriageEvaluation(user.id, symptomsToEvaluate, result);
      }

      return result;
    },
    onSuccess: (result) => {
      setLastResult(result);
      setIsEvaluating(false);
      options.onSuccess?.(result);
    },
    onError: (error: Error) => {
      setIsEvaluating(false);
      logger.error('Error en evaluación de triaje:', error);
      options.onError?.(error);
    },
  });

  // Mutation para generar preguntas de seguimiento
  const followUpMutation = useMutation({
    mutationFn: (symptomsForQuestions: Symptom[]) =>
      triageAgent.generateFollowUpQuestions(symptomsForQuestions),
  });

  // Agregar síntoma
  const addSymptom = useCallback((symptom: Symptom) => {
    setSymptoms((prev) => [...prev, symptom]);
  }, []);

  // Remover síntoma
  const removeSymptom = useCallback((index: number) => {
    setSymptoms((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Limpiar síntomas
  const clearSymptoms = useCallback(() => {
    setSymptoms([]);
    setLastResult(null);
  }, []);

  // Evaluar síntomas actuales
  const evaluate = useCallback(async () => {
    if (symptoms.length === 0) {
      throw new Error('No hay síntomas para evaluar');
    }
    return evaluateMutation.mutateAsync(symptoms);
  }, [symptoms, evaluateMutation]);

  // Evaluar síntomas específicos
  const evaluateSpecific = useCallback(
    async (specificSymptoms: Symptom[]) => {
      return evaluateMutation.mutateAsync(specificSymptoms);
    },
    [evaluateMutation],
  );

  // Obtener preguntas de seguimiento
  const getFollowUpQuestions = useCallback(async () => {
    if (symptoms.length === 0) {
      throw new Error('No hay síntomas para generar preguntas');
    }
    return followUpMutation.mutateAsync(symptoms);
  }, [symptoms, followUpMutation]);

  return {
    // Estado
    symptoms,
    isEvaluating,
    lastResult,

    // Acciones
    addSymptom,
    removeSymptom,
    clearSymptoms,
    evaluate,
    evaluateSpecific,
    getFollowUpQuestions,

    // Mutations (para acceso directo si es necesario)
    evaluateMutation,
    followUpMutation,
  };
}
