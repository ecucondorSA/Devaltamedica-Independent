/**
 * Local types for diagnostic engine integration
 * These types are defined locally to avoid circular dependencies
 */

// Core diagnostic types
export interface Question {
  id: string;
  text: string;
  type: 'boolean' | 'single-choice' | 'multiple-choice' | 'scale' | 'text';
  options?: Array<{
    id: string;
    text: string;
    value: any;
  }>;
  required?: boolean;
  category?: string;
}

export interface Answer {
  questionId: string;
  value: boolean | string | number | string[];
  timestamp: Date;
}

export interface Hypothesis {
  id: string;
  name: string;
  probability: number;
  description?: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface Report {
  sessionId: string;
  timestamp: Date;
  hypotheses: Hypothesis[];
  recommendations: string[];
  warnings: string[];
  summary: string;
  confidence: number;
}

export interface SessionState {
  id: string;
  startTime: Date;
  endTime?: Date;
  hypotheses: Hypothesis[];
  answeredQuestions: Array<{ question: Question; answer: Answer }>;
  patientInfo: {
    age: number;
    sex: 'male' | 'female';
  };
}

// Diagnostic engine interface (for dependency injection)
export interface IDiagnosticEngine {
  startSession(params: { age: number; sex: 'male' | 'female' }): SessionState;
  getSession(sessionId: string): SessionState | null;
  nextQuestion(sessionId: string): Question | null;
  submitAnswer(sessionId: string, questionId: string, answer: Answer): void;
  generateReport(sessionId: string): Report;
}

// Factory type for creating diagnostic engine instances
export type DiagnosticEngineFactory = () => IDiagnosticEngine;