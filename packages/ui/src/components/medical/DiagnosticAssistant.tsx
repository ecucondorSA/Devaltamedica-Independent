'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  Heart,
  MessageSquare,
  RefreshCw,
  Sparkles,
  TrendingUp,
  User,
  XCircle
} from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Progress } from '../Progress';
// Importación temporal comentada hasta que se resuelva la dependencia
// import type { Question, Answer, Hypothesis } from '@altamedica/diagnostic-engine/dist/types';

// Tipos temporales para desarrollo
export interface Question {
  id: string;
  text: string;
  type: 'yes_no' | 'multiple_choice' | 'scale';
  options?: string[];
}

export interface Answer {
  value: any;
}

export interface Hypothesis {
  id: string;
  name: string;
  probability: number;
  symptoms: string[];
}

export interface DiagnosticAssistantProps {
  currentQuestion: Question | null;
  hypotheses: Hypothesis[];
  progress: { answered: number; remaining?: number };
  isLoading: boolean;
  isComplete: boolean;
  onAnswer: (answer: Answer) => void;
  onReset: () => void;
  onStart: () => void;
  sessionStarted: boolean;
  patientInfo?: {
    age: number;
    sex: 'M' | 'F';
  };
}

export const DiagnosticAssistant: React.FC<DiagnosticAssistantProps> = ({
  currentQuestion,
  hypotheses,
  progress,
  isLoading,
  isComplete,
  onAnswer,
  onReset,
  onStart,
  sessionStarted,
  patientInfo
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const topHypotheses = hypotheses.slice(0, 5);

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null && currentQuestion) {
      onAnswer({ value: selectedAnswer });
      setSelectedAnswer(null);
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability > 0.7) return 'text-red-600 bg-red-50';
    if (probability > 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getProbabilityLabel = (probability: number) => {
    if (probability > 0.7) return 'Alta';
    if (probability > 0.4) return 'Media';
    return 'Baja';
  };

  // Welcome screen
  if (!sessionStarted) {
    return (
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Asistente de Diagnóstico Inteligente
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Te ayudaré a entender mejor tus síntomas mediante preguntas específicas
            </p>
          </div>

          {patientInfo && (
            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                <User className="w-3 h-3 mr-1" />
                {patientInfo.age} años
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {patientInfo.sex === 'M' ? 'Masculino' : 'Femenino'}
              </Badge>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm text-left">
                <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Nota Importante
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Este asistente es una herramienta de orientación. No reemplaza la consulta médica profesional.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onStart}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Comenzar Evaluación
          </Button>
        </div>
      </Card>
    );
  }

  // Completion screen
  if (isComplete) {
    return (
      <Card className="p-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Evaluación Completada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Basado en tus respuestas, estas son las posibles condiciones:
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Diagnósticos Probables:
            </h4>
            {topHypotheses.map((hypothesis, index) => {
              const percentage = (hypothesis.probability * 100).toFixed(1);
              const colorClass = getProbabilityColor(hypothesis.probability);
              
              return (
                <motion.div
                  key={hypothesis.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {hypothesis.name}
                      </span>
                    </div>
                    <Badge className={colorClass}>
                      {getProbabilityLabel(hypothesis.probability)} - {percentage}%
                    </Badge>
                  </div>
                  <Progress value={hypothesis.probability * 100} className="h-2" />
                </motion.div>
              );
            })}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Recomendación
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Consulta con un profesional médico para confirmar el diagnóstico y recibir el tratamiento adecuado.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onReset}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Nueva Evaluación
          </Button>
        </div>
      </Card>
    );
  }

  // Question screen
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Pregunta {progress.answered + 1} {progress.remaining !== undefined && `de ${progress.answered + progress.remaining}`}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {((progress.answered / (progress.answered + (progress.remaining || 1))) * 100).toFixed(0)}% completado
            </span>
          </div>
          <Progress 
            value={(progress.answered / (progress.answered + (progress.remaining || 1))) * 100} 
            className="h-2"
          />
        </div>

        {/* Current question */}
        {currentQuestion && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {currentQuestion.text}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedAnswer === true ? 'default' : 'outline'}
                  onClick={() => setSelectedAnswer(true)}
                  disabled={isLoading}
                  className="h-auto py-4"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Sí
                </Button>
                <Button
                  variant={selectedAnswer === false ? 'default' : 'outline'}
                  onClick={() => setSelectedAnswer(false)}
                  disabled={isLoading}
                  className="h-auto py-4"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  No
                </Button>
              </div>

              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Current hypotheses */}
        {topHypotheses.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hipótesis actuales
              </span>
            </div>
            <div className="space-y-2">
              {topHypotheses.slice(0, 3).map((hypothesis) => (
                <div 
                  key={hypothesis.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {hypothesis.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${hypothesis.probability * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                      {(hypothesis.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};