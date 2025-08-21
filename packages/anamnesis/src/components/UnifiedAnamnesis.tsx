/**
 * 🏥 UNIFIED ANAMNESIS COMPONENT
 * Componente principal unificado para recolección de historia clínica
 * 
 * Este componente unifica y mejora la experiencia de anamnesis
 * combinando las mejores características de todos los componentes existentes.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  FileText, 
  CheckCircle,
  AlertCircle,
  User,
  Heart,
  Brain,
  Activity,
  Clock,
  Award
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface AnamnesisSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  questions: AnamnesisQuestion[];
  required: boolean;
  completed: boolean;
}

export interface AnamnesisQuestion {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'boolean' | 'number' | 'scale';
  options?: string[];
  required: boolean;
  validation?: (value: any) => boolean;
  dependsOn?: string;
  helpText?: string;
}

export interface AnamnesisResponse {
  questionId: string;
  value: any;
  timestamp: Date;
}

export interface UnifiedAnamnesisProps {
  patientId: string;
  mode?: 'professional' | 'interactive' | 'gamified';
  onComplete?: (data: AnamnesisData) => void;
  onSave?: (data: Partial<AnamnesisData>) => void;
  initialData?: Partial<AnamnesisData>;
  className?: string;
}

export interface AnamnesisData {
  patientId: string;
  sections: Record<string, AnamnesisResponse[]>;
  completedAt?: Date;
  progress: number;
  mode: string;
}

// ============================================================================
// SECCIONES DE ANAMNESIS
// ============================================================================

const ANAMNESIS_SECTIONS: AnamnesisSection[] = [
  {
    id: 'identification',
    title: 'Identificación del Paciente',
    icon: <User className="w-5 h-5" />,
    description: 'Información básica y datos demográficos',
    required: true,
    completed: false,
    questions: [
      {
        id: 'fullName',
        text: 'Nombre completo',
        type: 'text',
        required: true
      },
      {
        id: 'birthDate',
        text: 'Fecha de nacimiento',
        type: 'date',
        required: true
      },
      {
        id: 'gender',
        text: 'Género',
        type: 'select',
        options: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'],
        required: true
      },
      {
        id: 'occupation',
        text: 'Ocupación',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'chiefComplaint',
    title: 'Motivo de Consulta',
    icon: <AlertCircle className="w-5 h-5" />,
    description: '¿Qué lo trae a consulta hoy?',
    required: true,
    completed: false,
    questions: [
      {
        id: 'mainSymptom',
        text: 'Describa su síntoma principal',
        type: 'text',
        required: true,
        helpText: 'Sea lo más específico posible'
      },
      {
        id: 'duration',
        text: '¿Hace cuánto tiempo presenta estos síntomas?',
        type: 'select',
        options: ['Horas', 'Días', 'Semanas', 'Meses', 'Años'],
        required: true
      },
      {
        id: 'severity',
        text: 'En una escala del 1 al 10, ¿qué tan severo es?',
        type: 'scale',
        required: true
      }
    ]
  },
  {
    id: 'currentIllness',
    title: 'Enfermedad Actual',
    icon: <Heart className="w-5 h-5" />,
    description: 'Historia detallada del padecimiento actual',
    required: true,
    completed: false,
    questions: [
      {
        id: 'onset',
        text: '¿Cómo comenzaron los síntomas?',
        type: 'select',
        options: ['Súbito', 'Gradual', 'Intermitente'],
        required: true
      },
      {
        id: 'triggers',
        text: '¿Qué empeora los síntomas?',
        type: 'text',
        required: false
      },
      {
        id: 'relief',
        text: '¿Qué mejora los síntomas?',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'medicalHistory',
    title: 'Antecedentes Médicos',
    icon: <Activity className="w-5 h-5" />,
    description: 'Historial médico previo',
    required: true,
    completed: false,
    questions: [
      {
        id: 'chronicDiseases',
        text: '¿Padece alguna enfermedad crónica?',
        type: 'multiselect',
        options: ['Diabetes', 'Hipertensión', 'Asma', 'Cardiopatía', 'Ninguna'],
        required: true
      },
      {
        id: 'surgeries',
        text: '¿Ha tenido cirugías previas?',
        type: 'boolean',
        required: true
      },
      {
        id: 'allergies',
        text: '¿Es alérgico a algún medicamento?',
        type: 'text',
        required: true
      }
    ]
  },
  {
    id: 'familyHistory',
    title: 'Antecedentes Familiares',
    icon: <Brain className="w-5 h-5" />,
    description: 'Enfermedades en la familia',
    required: false,
    completed: false,
    questions: [
      {
        id: 'familyDiseases',
        text: '¿Hay enfermedades hereditarias en su familia?',
        type: 'multiselect',
        options: ['Diabetes', 'Cáncer', 'Hipertensión', 'Enfermedad cardíaca', 'Ninguna'],
        required: false
      }
    ]
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const UnifiedAnamnesis: React.FC<UnifiedAnamnesisProps> = ({
  patientId,
  mode = 'professional',
  onComplete,
  onSave,
  initialData,
  className = ''
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sections, setSections] = useState(ANAMNESIS_SECTIONS);
  const [responses, setResponses] = useState<Record<string, AnamnesisResponse[]>>({});
  const [progress, setProgress] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isGamified] = useState(mode === 'gamified');
  const [points, setPoints] = useState(0);

  const currentSection = sections[currentSectionIndex];

  // Calcular progreso
  useEffect(() => {
    const totalQuestions = sections.reduce((acc, section) => 
      acc + section.questions.filter(q => q.required).length, 0
    );
    
    const answeredQuestions = Object.values(responses).reduce((acc, sectionResponses) => 
      acc + sectionResponses.length, 0
    );
    
    const newProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    setProgress(newProgress);
    
    // Gamification points
    if (isGamified && answeredQuestions > 0) {
      setPoints(answeredQuestions * 10);
    }
  }, [responses, sections, isGamified]);

  // Manejar respuestas
  const handleResponse = (questionId: string, value: any) => {
    const sectionId = currentSection.id;
    const newResponse: AnamnesisResponse = {
      questionId,
      value,
      timestamp: new Date()
    };
    
    setResponses(prev => ({
      ...prev,
      [sectionId]: [
        ...(prev[sectionId] || []).filter(r => r.questionId !== questionId),
        newResponse
      ]
    }));
    
    // Auto-save
    if (onSave) {
      onSave({
        patientId,
        sections: {
          ...responses,
          [sectionId]: [
            ...(responses[sectionId] || []).filter(r => r.questionId !== questionId),
            newResponse
          ]
        },
        progress,
        mode
      });
    }
  };

  // Navegación
  const goToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goToPreviousSection = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  // Completar anamnesis
  const completeAnamnesis = () => {
    const data: AnamnesisData = {
      patientId,
      sections: responses,
      completedAt: new Date(),
      progress: 100,
      mode
    };
    
    if (onComplete) {
      onComplete(data);
    }
  };

  // Renderizar pregunta según tipo
  const renderQuestion = (question: AnamnesisQuestion) => {
    const sectionResponses = responses[currentSection.id] || [];
    const existingResponse = sectionResponses.find(r => r.questionId === question.id);
    const currentValue = existingResponse?.value || '';

    switch (question.type) {
      case 'text':
        return (
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Escriba su respuesta..."
            value={currentValue}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            rows={3}
          />
        );
      
      case 'select':
        return (
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={currentValue}
            onChange={(e) => handleResponse(question.id, e.target.value)}
          >
            <option value="">Seleccione una opción</option>
            {question.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(currentValue as string[])?.includes(option) || false}
                  onChange={(e) => {
                    const currentArray = (currentValue as string[]) || [];
                    const newValue = e.target.checked
                      ? [...currentArray, option]
                      : currentArray.filter(v => v !== option);
                    handleResponse(question.id, newValue);
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'boolean':
        return (
          <div className="flex space-x-4">
            <button
              onClick={() => handleResponse(question.id, true)}
              className={`px-4 py-2 rounded-lg ${
                currentValue === true 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sí
            </button>
            <button
              onClick={() => handleResponse(question.id, false)}
              className={`px-4 py-2 rounded-lg ${
                currentValue === false 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              No
            </button>
          </div>
        );
      
      case 'scale':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              value={currentValue || 5}
              onChange={(e) => handleResponse(question.id, parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>1 (Leve)</span>
              <span className="font-bold text-lg">{currentValue || 5}</span>
              <span>10 (Severo)</span>
            </div>
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={currentValue}
            onChange={(e) => handleResponse(question.id, e.target.value)}
          />
        );
      
      default:
        return null;
    }
  };

  // Renderizar resumen
  const renderSummary = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Resumen de Anamnesis</h2>
      
      {sections.map(section => {
        const sectionResponses = responses[section.id] || [];
        if (sectionResponses.length === 0) return null;
        
        return (
          <div key={section.id} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              {section.icon}
              <span className="ml-2">{section.title}</span>
            </h3>
            <div className="space-y-2">
              {section.questions.map(question => {
                const response = sectionResponses.find(r => r.questionId === question.id);
                if (!response) return null;
                
                return (
                  <div key={question.id} className="text-sm">
                    <span className="font-medium">{question.text}:</span>
                    <span className="ml-2 text-gray-700">
                      {Array.isArray(response.value) 
                        ? response.value.join(', ')
                        : String(response.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      <div className="flex justify-between mt-6">
        <button
          onClick={goToPreviousSection}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Editar Respuestas
        </button>
        <button
          onClick={completeAnamnesis}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Completar Anamnesis
        </button>
      </div>
    </div>
  );

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progreso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Gamification Points */}
      {isGamified && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-6 flex items-center justify-center bg-yellow-50 p-4 rounded-lg"
        >
          <Award className="w-8 h-8 text-yellow-500 mr-3" />
          <span className="text-2xl font-bold text-yellow-700">{points} puntos</span>
        </motion.div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {!showSummary ? (
          <motion.div
            key={currentSection.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            {/* Section Header */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                {currentSection.icon}
                <h2 className="text-2xl font-bold text-gray-800 ml-2">
                  {currentSection.title}
                </h2>
              </div>
              <p className="text-gray-600">{currentSection.description}</p>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {currentSection.questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-gray-700">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {question.helpText && (
                    <p className="text-xs text-gray-500">{question.helpText}</p>
                  )}
                  {renderQuestion(question)}
                </motion.div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={goToPreviousSection}
                disabled={currentSectionIndex === 0}
                className={`px-6 py-3 rounded-lg transition-colors flex items-center ${
                  currentSectionIndex === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Anterior
              </button>
              
              <button
                onClick={goToNextSection}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              >
                {currentSectionIndex === sections.length - 1 ? 'Ver Resumen' : 'Siguiente'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            {renderSummary()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => setCurrentSectionIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSectionIndex
                ? 'bg-blue-500'
                : index < currentSectionIndex || (responses[section.id]?.length > 0)
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
            title={section.title}
          />
        ))}
      </div>
    </div>
  );
};

export default UnifiedAnamnesis;