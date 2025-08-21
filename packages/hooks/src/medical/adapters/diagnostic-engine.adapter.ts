/**
 * Adapter to use the real diagnostic engine with the hook
 * This file should be imported only by applications, not by the hooks package itself
 */

import type { IDiagnosticEngine, DiagnosticEngineFactory } from '../types/diagnostic.types';

/**
 * Creates a factory function for the diagnostic engine
 * This function should be called by applications that want to use the real engine
 * 
 * @example
 * ```typescript
 * // In your application code:
 * import { DiagnosticEngine } from '@altamedica/diagnostic-engine';
 * import { createDiagnosticEngineFactory } from '@altamedica/hooks/medical/adapters';
 * 
 * const engineFactory = createDiagnosticEngineFactory(DiagnosticEngine);
 * const { startSession } = useDiagnosticEngine({ 
 *   engineFactory,
 *   age: 35,
 *   sex: 'M'
 * });
 * ```
 */
export function createDiagnosticEngineFactory(
  DiagnosticEngineClass: new () => IDiagnosticEngine
): DiagnosticEngineFactory {
  return () => new DiagnosticEngineClass();
}

/**
 * Mock factory for testing purposes
 */
export function createMockDiagnosticEngineFactory(): DiagnosticEngineFactory {
  return () => ({
    startSession: (params) => ({
      id: 'mock-session-id',
      startTime: new Date(),
      hypotheses: [],
      answeredQuestions: [],
      patientInfo: {
        age: params.age,
        sex: params.sex
      }
    }),
    getSession: (sessionId) => null,
    nextQuestion: (sessionId) => ({
      id: 'mock-question-1',
      text: 'How are you feeling today?',
      type: 'scale',
      options: [
        { id: '1', text: 'Very bad', value: 1 },
        { id: '2', text: 'Bad', value: 2 },
        { id: '3', text: 'Normal', value: 3 },
        { id: '4', text: 'Good', value: 4 },
        { id: '5', text: 'Very good', value: 5 }
      ]
    }),
    submitAnswer: (sessionId, questionId, answer) => {},
    generateReport: (sessionId) => ({
      sessionId,
      timestamp: new Date(),
      hypotheses: [],
      recommendations: ['Rest and drink fluids'],
      warnings: [],
      summary: 'No significant health concerns detected',
      confidence: 0.85
    })
  });
}