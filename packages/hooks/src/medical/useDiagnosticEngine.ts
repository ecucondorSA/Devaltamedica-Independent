import { useState, useCallback, useRef } from 'react';
import type { 
  SessionState, 
  Question, 
  Answer, 
  Report,
  Hypothesis,
  IDiagnosticEngine,
  DiagnosticEngineFactory
} from './types/diagnostic.types';

export interface DiagnosticSession {
  sessionId: string;
  currentQuestion: Question | null;
  hypotheses: Hypothesis[];
  answeredQuestions: Array<{ question: Question; answer: Answer }>;
  isComplete: boolean;
  report: Report | null;
  safetyWarnings: string[];
}

export interface UseDiagnosticEngineOptions {
  age: number;
  sex: 'M' | 'F';
  onSafetyWarning?: (warnings: string[]) => void;
  maxQuestions?: number;
  /**
   * Optional factory for creating diagnostic engine instances
   * This allows for dependency injection and testing
   */
  engineFactory?: DiagnosticEngineFactory;
}

export function useDiagnosticEngine(options: UseDiagnosticEngineOptions) {
  const engineRef = useRef<IDiagnosticEngine | null>(null);
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the engine
  const initializeEngine = useCallback(() => {
    if (!engineRef.current) {
      if (!options.engineFactory) {
        throw new Error('Diagnostic engine factory is required. Please provide engineFactory in options.');
      }
      engineRef.current = options.engineFactory();
    }
    return engineRef.current;
  }, [options.engineFactory]);

  // Start a new diagnostic session
  const startSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const engine = initializeEngine();
      const newSession = engine.startSession({
        age: options.age,
        sex: options.sex === 'M' ? 'male' : 'female'
      });

      const firstQuestion = engine.nextQuestion(newSession.id);
      
      setSession({
        sessionId: newSession.id,
        currentQuestion: firstQuestion,
        hypotheses: newSession.hypotheses,
        answeredQuestions: [],
        isComplete: false,
        report: null,
        safetyWarnings: []
      });

      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start diagnostic session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options.age, options.sex, initializeEngine]);

  // Submit an answer to the current question
  const submitAnswer = useCallback(async (answer: Answer) => {
    if (!session || !session.currentQuestion || !engineRef.current) {
      throw new Error('No active session or question');
    }

    try {
      setIsLoading(true);
      setError(null);

      const engine = engineRef.current;
      
      // Submit the answer
      engine.submitAnswer(session.sessionId, session.currentQuestion.id, answer);

      // Get updated session state
      const updatedSession = engine.getSession(session.sessionId);
      if (!updatedSession) {
        throw new Error('Session not found after answer submission');
      }

      // Check for safety warnings
      const report = engine.generateReport(session.sessionId);
      const safetyWarnings = report?.warnings || [];
      
      if (safetyWarnings.length > 0 && options.onSafetyWarning) {
        options.onSafetyWarning(safetyWarnings);
      }

      // Get next question or complete session
      const nextQuestion = engine.nextQuestion(session.sessionId);
      const isComplete: boolean = !nextQuestion || 
        (options.maxQuestions !== undefined && session.answeredQuestions.length >= options.maxQuestions - 1);

      // Update session state
      setSession(prev => {
        if (!prev) return null;
        
        const newAnsweredQuestions = [
          ...prev.answeredQuestions,
          { question: prev.currentQuestion!, answer }
        ];

        return {
          ...prev,
          currentQuestion: isComplete ? null : nextQuestion,
          hypotheses: updatedSession.hypotheses,
          answeredQuestions: newAnsweredQuestions,
          isComplete,
          report: isComplete ? report : null,
          safetyWarnings
        };
      });

      return { nextQuestion, isComplete, safetyWarnings };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, options]);

  // Generate final report
  const generateReport = useCallback(() => {
    if (!session || !engineRef.current) {
      throw new Error('No active session');
    }

    try {
      const engine = engineRef.current;
      const report = engine.generateReport(session.sessionId);
      
      setSession(prev => prev ? { ...prev, report, isComplete: true } : null);
      
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      throw err;
    }
  }, [session]);

  // Reset the session
  const resetSession = useCallback(() => {
    setSession(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Get top hypotheses
  const getTopHypotheses = useCallback((limit = 5) => {
    if (!session) return [];
    
    return [...session.hypotheses]
      .sort((a, b) => b.probability - a.probability)
      .slice(0, limit);
  }, [session]);

  // Check if urgent care is needed
  const needsUrgentCare = useCallback(() => {
    if (!session) return false;
    
    // Check for red flags in top hypotheses
    const dangerousConditions = ['cond:mi', 'cond:pneumonia', 'cond:arrhythmia'];
    const topHypothesis = getTopHypotheses(1)[0];
    
    if (!topHypothesis) return false;
    
    return dangerousConditions.includes(topHypothesis.id) && 
           topHypothesis.probability > 0.15;
  }, [session, getTopHypotheses]);

  return {
    // State
    session,
    isLoading,
    error,
    
    // Actions
    startSession,
    submitAnswer,
    generateReport,
    resetSession,
    
    // Computed
    getTopHypotheses,
    needsUrgentCare,
    
    // Convenience
    currentQuestion: session?.currentQuestion,
    isComplete: session?.isComplete || false,
    progress: session ? {
      answered: session.answeredQuestions.length,
      remaining: options.maxQuestions ? 
        Math.max(0, options.maxQuestions - session.answeredQuestions.length) : 
        undefined
    } : null
  };
}