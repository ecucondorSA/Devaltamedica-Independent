// 🤖 ASISTENTE DE IA MÉDICA - ALTAMEDICA
// Sistema inteligente de asistencia médica con análisis de síntomas y recomendaciones
// Integrado con modelos de IA especializados en diagnóstico médico

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Brain, Stethoscope, MessageCircle, Send, Loader2, 
  AlertTriangle, CheckCircle, Lightbulb, FileText,
  TrendingUp, Users, Clock, Star, Zap
} from 'lucide-react';
import { CardCorporate, CardHeaderCorporate, CardContentCorporate } from '../corporate/CardCorporate';
import { ButtonCorporate } from '../corporate/ButtonCorporate';
import { StatusBadge } from '../medical/StatusBadge';
import { useMedicalValidation } from '../../hooks/useMedicalValidation';
import { PatientData } from '../../hooks/usePatientData';

// 🧠 TIPOS DE IA MÉDICA
export interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  frequency: 'occasional' | 'frequent' | 'constant';
  description?: string;
}

export interface DiagnosisSuggestion {
  condition: string;
  probability: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string[];
  supportingFactors: string[];
  recommendations: string[];
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  specialistReferral?: string;
}

export interface TreatmentRecommendation {
  type: 'medication' | 'lifestyle' | 'procedure' | 'monitoring';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  duration?: string;
  contraindications?: string[];
  sideEffects?: string[];
}

export interface AIAnalysisResult {
  diagnosis: DiagnosisSuggestion[];
  treatments: TreatmentRecommendation[];
  riskFactors: string[];
  followUpRecommendations: string[];
  confidenceScore: number;
  processingTime: number;
}

// 🎯 PROPS DEL COMPONENTE
export interface MedicalAIAssistantProps {
  patient: PatientData;
  symptoms: Symptom[];
  onSuggestDiagnosis?: (suggestions: DiagnosisSuggestion[]) => void;
  onRecommendTreatment?: (recommendations: TreatmentRecommendation[]) => void;
  onAnalysisComplete?: (result: AIAnalysisResult) => void;
  aiModel?: 'gpt-medical' | 'claude-medical' | 'custom-model';
  enableRealTimeAnalysis?: boolean;
  showConfidenceScores?: boolean;
  className?: string;
}

// 🏥 CONFIGURACIÓN DE MODELOS DE IA
const AI_MODELS = {
  'gpt-medical': {
    name: 'GPT Medical Assistant',
    description: 'Modelo especializado en diagnóstico médico',
    accuracy: 92,
    responseTime: '2-5s'
  },
  'claude-medical': {
    name: 'Claude Medical Expert',
    description: 'Análisis médico conservador y preciso',
    accuracy: 94,
    responseTime: '3-7s'
  },
  'custom-model': {
    name: 'AltaMedica AI Model',
    description: 'Modelo personalizado para telemedicina',
    accuracy: 96,
    responseTime: '1-3s'
  }
};

// 🤖 COMPONENTE PRINCIPAL
export const MedicalAIAssistant: React.FC<MedicalAIAssistantProps> = ({
  patient,
  symptoms,
  onSuggestDiagnosis,
  onRecommendTreatment,
  onAnalysisComplete,
  aiModel = 'claude-medical',
  enableRealTimeAnalysis = true,
  showConfidenceScores = true,
  className = ''
}) => {
  // 📊 ESTADO
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>>([]);
  const [userMessage, setUserMessage] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { validateVitalSign } = useMedicalValidation();

  // 🧠 ANÁLISIS DE IA SIMULADO (En producción usar API real)
  const performAIAnalysis = useCallback(async (): Promise<AIAnalysisResult> => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simular progreso de análisis
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      // Simular delay de procesamiento de IA
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      // 🎯 ANÁLISIS BASADO EN SÍNTOMAS Y DATOS DEL PACIENTE
      const diagnosisSuggestions: DiagnosisSuggestion[] = [];
      const treatmentRecommendations: TreatmentRecommendation[] = [];
      const riskFactors: string[] = [];

      // Análisis inteligente basado en síntomas
      symptoms.forEach(symptom => {
        switch (symptom.name.toLowerCase()) {
          case 'dolor de pecho':
            diagnosisSuggestions.push({
              condition: 'Angina de Pecho',
              probability: 75,
              confidence: 'medium',
              reasoning: [
                'Dolor torácico típico',
                'Factores de riesgo cardiovascular presentes',
                'Patrón de síntomas compatible'
              ],
              supportingFactors: [
                'Historial de hipertensión del paciente',
                'Edad superior a 50 años',
                'Síntoma relacionado con esfuerzo'
              ],
              recommendations: [
                'Electrocardiograma de 12 derivaciones',
                'Troponinas cardíacas',
                'Ecocardiograma de estrés'
              ],
              urgency: 'urgent',
              specialistReferral: 'Cardiología'
            });
            break;

          case 'fiebre':
            if (symptom.severity === 'severe') {
              diagnosisSuggestions.push({
                condition: 'Proceso Infeccioso Sistémico',
                probability: 85,
                confidence: 'high',
                reasoning: [
                  'Fiebre alta persistente',
                  'Posible respuesta inflamatoria sistémica'
                ],
                supportingFactors: [
                  'Temperatura > 38.5°C',
                  'Duración prolongada de síntomas'
                ],
                recommendations: [
                  'Hemograma completo con diferencial',
                  'Hemocultivos x2',
                  'PCR y procalcitonina'
                ],
                urgency: 'urgent'
              });
            }
            break;

          case 'dificultad respiratoria':
            diagnosisSuggestions.push({
              condition: 'Insuficiencia Respiratoria',
              probability: 80,
              confidence: 'high',
              reasoning: [
                'Disnea significativa',
                'Compromiso respiratorio evidente'
              ],
              supportingFactors: [
                'Saturación de oxígeno posiblemente comprometida',
                'Esfuerzo respiratorio aumentado'
              ],
              recommendations: [
                'Gasometría arterial',
                'Radiografía de tórax',
                'Oximetría de pulso continua'
              ],
              urgency: 'emergency'
            });
            break;
        }
      });

      // Análisis de factores de riesgo del paciente
      if (patient.chronicConditions.includes('Diabetes Tipo 2')) {
        riskFactors.push('Diabetes mellitus: Aumenta riesgo cardiovascular y de infecciones');
      }
      if (patient.chronicConditions.includes('Hipertensión')) {
        riskFactors.push('Hipertensión arterial: Factor de riesgo cardiovascular mayor');
      }

      // Recomendaciones de tratamiento generales
      treatmentRecommendations.push({
        type: 'monitoring',
        title: 'Monitoreo de Signos Vitales',
        description: 'Control estricto de presión arterial, frecuencia cardíaca y saturación de oxígeno',
        priority: 'high',
        duration: 'Continuo durante hospitalización'
      });

      // Calcular edad a partir de fecha de nacimiento
      const age = Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age > 65) {
        treatmentRecommendations.push({
          type: 'lifestyle',
          title: 'Cuidados Geriátricos',
          description: 'Consideraciones especiales para paciente de edad avanzada',
          priority: 'medium',
          contraindications: ['Evitar polifarmacia', 'Monitorear función renal']
        });
      }

      const result: AIAnalysisResult = {
        diagnosis: diagnosisSuggestions,
        treatments: treatmentRecommendations,
        riskFactors,
        followUpRecommendations: [
          'Control médico en 24-48 horas',
          'Monitoreo domiciliario de signos vitales',
          'Educación al paciente sobre signos de alarma'
        ],
        confidenceScore: diagnosisSuggestions.length > 0 ? 
          Math.round(diagnosisSuggestions.reduce((acc, d) => acc + d.probability, 0) / diagnosisSuggestions.length) : 0,
        processingTime: 3000
      };

      return result;
    } finally {
      setIsAnalyzing(false);
      clearInterval(progressInterval);
    }
  }, [symptoms, patient]);

  // 🚀 EJECUTAR ANÁLISIS
  const runAnalysis = useCallback(async () => {
    const result = await performAIAnalysis();
    setAnalysisResult(result);
    
    onSuggestDiagnosis?.(result.diagnosis);
    onRecommendTreatment?.(result.treatments);
    onAnalysisComplete?.(result);

    // Añadir resultado al historial de conversación
    setConversationHistory(prev => [...prev, {
      type: 'ai',
      message: `He analizado los síntomas del paciente. Encontré ${result.diagnosis.length} posibles diagnósticos con una confianza del ${result.confidenceScore}%.`,
      timestamp: new Date()
    }]);
  }, [performAIAnalysis, onSuggestDiagnosis, onRecommendTreatment, onAnalysisComplete]);

  // 💬 ENVIAR MENSAJE
  const sendMessage = useCallback(async () => {
    if (!userMessage.trim()) return;

    // Añadir mensaje del usuario
    setConversationHistory(prev => [...prev, {
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    }]);

    setUserMessage('');

    // Simular respuesta de IA
    setTimeout(() => {
      let aiResponse = '';
      
      if (userMessage.toLowerCase().includes('síntoma')) {
        aiResponse = 'Entiendo que hay nuevos síntomas. Por favor, proporciona más detalles sobre intensidad, duración y factores desencadenantes para un análisis más preciso.';
      } else if (userMessage.toLowerCase().includes('medicamento')) {
        aiResponse = 'Revisaré las interacciones medicamentosas y contraindicaciones basándome en el historial médico del paciente.';
      } else if (userMessage.toLowerCase().includes('urgente')) {
        aiResponse = 'Basándome en la información disponible, recomiendo evaluación médica presencial inmediata. He marcado este caso como alta prioridad.';
      } else {
        aiResponse = 'He registrado tu consulta. ¿Podrías proporcionar más detalles específicos sobre los síntomas o preocupaciones médicas?';
      }

      setConversationHistory(prev => [...prev, {
        type: 'ai',
        message: aiResponse,
        timestamp: new Date()
      }]);
    }, 1500);
  }, [userMessage]);

  // 📜 SCROLL AUTOMÁTICO
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // 🔄 ANÁLISIS AUTOMÁTICO AL CAMBIAR SÍNTOMAS
  useEffect(() => {
    if (enableRealTimeAnalysis && symptoms.length > 0) {
      const debounceTimer = setTimeout(() => {
        runAnalysis();
      }, 2000);

      return () => clearTimeout(debounceTimer);
    }
  }, [symptoms, enableRealTimeAnalysis, runAnalysis]);

  const modelConfig = AI_MODELS[aiModel];

  return (
    <CardCorporate 
      variant="default" 
      className={`max-w-4xl ${className}`}
      medical={true}
    >
      <CardHeaderCorporate
        title="Asistente de IA Médica"
        subtitle={`${modelConfig.name} - Precisión: ${modelConfig.accuracy}%`}
        medical={true}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge 
              status={isAnalyzing ? 'in_progress' : 'active'} 
              text={isAnalyzing ? 'Analizando...' : 'Activo'}
              animate={isAnalyzing}
            />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-primary-altamedica">🧠</span>
              {modelConfig.responseTime}
            </div>
          </div>
        }
      />

      <CardContentCorporate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PANEL DE CHAT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-primary-altamedica">💬</span>
              <h3 className="text-lg font-semibold text-gray-800">Consulta Médica</h3>
            </div>

            {/* HISTORIAL DE CONVERSACIÓN */}
            <div className="h-80 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
              {conversationHistory.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-6xl text-gray-300 mx-auto mb-3">🧠</div>
                  <p className="text-sm">Inicia una consulta médica con IA</p>
                </div>
              )}
              
              {conversationHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-xs px-4 py-2 rounded-lg text-sm
                      ${message.type === 'user' 
                        ? 'bg-primary-altamedica text-white' 
                        : 'bg-white border border-gray-200'
                      }
                    `}
                  >
                    <p>{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('es-AR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT DE MENSAJE */}
            <div className="flex gap-2">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Describe síntomas adicionales o haz una pregunta..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <ButtonCorporate
                variant="primary"
                size="md"
                onClick={sendMessage}
                disabled={!userMessage.trim()}
                icon={<span>📤</span>}
              >
                Enviar
              </ButtonCorporate>
            </div>
          </div>

          {/* PANEL DE ANÁLISIS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-secondary-altamedica">🩺</span>
                <h3 className="text-lg font-semibold text-gray-800">Análisis Médico</h3>
              </div>
              <ButtonCorporate
                variant="medical"
                size="sm"
                onClick={runAnalysis}
                loading={isAnalyzing}
                icon={<span>⚡</span>}
              >
                Analizar
              </ButtonCorporate>
            </div>

            {/* PROGRESO DE ANÁLISIS */}
            {isAnalyzing && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-blue-800">
                    Procesando con IA Médica...
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-600 mt-1">{analysisProgress}% completado</p>
              </div>
            )}

            {/* RESULTADOS DE ANÁLISIS */}
            {analysisResult && (
              <div className="space-y-4">
                {/* SCORE DE CONFIANZA */}
                {showConfidenceScores && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">
                        Confianza del Análisis
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-lg font-bold text-green-700">
                          {analysisResult.confidenceScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* DIAGNÓSTICOS SUGERIDOS */}
                {analysisResult.diagnosis.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-altamedica" />
                      Diagnósticos Sugeridos
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.diagnosis.map((diagnosis, index) => (
                        <div 
                          key={index}
                          className="p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">
                              {diagnosis.condition}
                            </span>
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                status={
                                  diagnosis.urgency === 'emergency' ? 'critical' :
                                  diagnosis.urgency === 'urgent' ? 'warning' :
                                  'info'
                                }
                                size="sm"
                              />
                              <span className="text-sm font-medium text-primary-altamedica">
                                {diagnosis.probability}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {diagnosis.reasoning.join(', ')}
                          </p>
                          {diagnosis.specialistReferral && (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Referir a: {diagnosis.specialistReferral}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECOMENDACIONES DE TRATAMIENTO */}
                {analysisResult.treatments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-secondary-altamedica" />
                      Recomendaciones
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.treatments.map((treatment, index) => (
                        <div 
                          key={index}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge
                              status={treatment.priority === 'high' ? 'warning' : 'info'}
                              size="sm"
                            />
                            <span className="font-medium text-gray-800">
                              {treatment.title}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {treatment.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FACTORES DE RIESGO */}
                {analysisResult.riskFactors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      Factores de Riesgo
                    </h4>
                    <div className="space-y-1">
                      {analysisResult.riskFactors.map((factor, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-warning">•</span>
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SEGUIMIENTO */}
                {analysisResult.followUpRecommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-info" />
                      Seguimiento
                    </h4>
                    <div className="space-y-1">
                      {analysisResult.followUpRecommendations.map((followUp, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-success mt-0.5" />
                          {followUp}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DISCLAIMER MÉDICO */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">
                Importante: Asistencia de IA Médica
              </p>
              <p className="text-yellow-700">
                Esta herramienta proporciona asistencia diagnóstica basada en IA y no reemplaza 
                el criterio médico profesional. Todos los diagnósticos y tratamientos deben ser 
                validados por un médico certificado.
              </p>
            </div>
          </div>
        </div>
      </CardContentCorporate>
    </CardCorporate>
  );
};