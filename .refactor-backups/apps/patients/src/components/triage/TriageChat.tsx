'use client';

import { triageAgent, UrgencyLevel, type TriageResult } from '@/services/triage-agent.service';
import { useAuth  } from '@altamedica/auth';;
import { Badge, Button, Card, Input, Textarea } from '@altamedica/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertCircle, Clock, MapPin, Phone, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

interface SymptomInput {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  location?: string;
}

export function TriageChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content:
        '¡Hola! Soy tu asistente de triaje médico 🏥. Estoy aquí para evaluar tus síntomas y ayudarte a determinar el nivel de atención que necesitas. ¿Qué síntomas estás experimentando?',
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [symptoms, setSymptoms] = useState<SymptomInput[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState<SymptomInput>({
    name: '',
    severity: 'mild',
    duration: '',
  });
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [showSymptomForm, setShowSymptomForm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type: Message['type'], content: string, data?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!input.trim() && symptoms.length === 0) return;

    // Add user message
    if (input.trim()) {
      addMessage('user', input);

      // Parse symptoms from text (simplified)
      const symptomKeywords = ['dolor', 'fiebre', 'tos', 'mareo', 'náusea', 'vómito'];
      const foundSymptom = symptomKeywords.find((keyword) => input.toLowerCase().includes(keyword));

      if (foundSymptom) {
        setCurrentSymptom((prev) => ({
          ...prev,
          name: input,
        }));
        setShowSymptomForm(true);
      }
    }

    setInput('');
    setIsLoading(true);

    try {
      if (symptoms.length > 0 || currentSymptom.name) {
        // Perform triage evaluation
        const symptomsToEvaluate = currentSymptom.name ? [...symptoms, currentSymptom] : symptoms;

        const result = await triageAgent.evaluateSymptoms(symptomsToEvaluate);
        setTriageResult(result);

        // Add agent response with results
        addMessage('agent', generateTriageResponse(result), result);

        // Generate follow-up questions if needed
        if (
          result.urgencyLevel === UrgencyLevel.ROUTINE ||
          result.urgencyLevel === UrgencyLevel.SEMI_URGENT
        ) {
          const questions = await triageAgent.generateFollowUpQuestions(symptomsToEvaluate);
          if (questions.length > 0) {
            setTimeout(() => {
              addMessage(
                'agent',
                'Para refinar mi evaluación, ¿podrías responder estas preguntas?',
              );
              questions.forEach((q, i) => {
                setTimeout(
                  () => {
                    addMessage('system', `${i + 1}. ${q}`);
                  },
                  (i + 1) * 100,
                );
              });
            }, 1000);
          }
        }

        // Log evaluation for audit
        if (user?.id) {
          await triageAgent.logTriageEvaluation(user.id, symptomsToEvaluate, result);
        }
      } else {
        // Provide guidance on how to describe symptoms
        addMessage(
          'agent',
          'Por favor, describe tus síntomas con más detalle. Por ejemplo:\n' +
            '• "Tengo dolor de cabeza intenso desde ayer"\n' +
            '• "Fiebre de 39°C y tos seca"\n' +
            '• "Dolor en el pecho al respirar"\n\n' +
            'Mientras más específico seas, mejor podré ayudarte.',
        );
      }
    } catch (error) {
      logger.error('Error en triaje:', error);
      addMessage(
        'system',
        '❌ Ocurrió un error al procesar tu evaluación. Por favor, intenta nuevamente.',
      );
    } finally {
      setIsLoading(false);
      setShowSymptomForm(false);
      setCurrentSymptom({ name: '', severity: 'mild', duration: '' });
    }
  };

  const generateTriageResponse = (result: TriageResult): string => {
    const urgencyEmoji = {
      emergency: '🚨',
      urgent: '⚠️',
      'semi-urgent': '📅',
      routine: '📋',
    };

    let response = `${urgencyEmoji[result.urgencyLevel]} **Evaluación de Triaje Completada**\n\n`;
    response += `**Nivel de Urgencia:** ${getUrgencyLabel(result.urgencyLevel)}\n`;
    response += `**Acción Recomendada:** ${result.recommendedAction}\n`;
    response += `**Tiempo de Espera Estimado:** ${result.estimatedWaitTime}\n`;

    if (result.suggestedSpecialty) {
      response += `**Especialidad Sugerida:** ${result.suggestedSpecialty}\n`;
    }

    if (result.redFlags.length > 0) {
      response += `\n**⚠️ Señales de Alarma Detectadas:**\n`;
      result.redFlags.forEach((flag) => {
        response += `• ${flag}\n`;
      });
    }

    response += `\n**📋 Instrucciones:**\n`;
    result.instructions.forEach((instruction) => {
      response += `• ${instruction}\n`;
    });

    response += `\n*Confianza en la evaluación: ${result.confidence}%*`;

    return response;
  };

  const getUrgencyLabel = (urgency: string): string => {
    const labels: Record<string, string> = {
      emergency: 'EMERGENCIA - Atención Inmediata',
      urgent: 'URGENTE - Dentro de 2 horas',
      'semi-urgent': 'SEMI-URGENTE - Dentro de 24 horas',
      routine: 'RUTINA - Puede esperar días',
    };
    return labels[urgency] || urgency;
  };

  const getUrgencyColor = (urgency: string): string => {
    const colors: Record<string, string> = {
      emergency: 'bg-red-500',
      urgent: 'bg-orange-500',
      'semi-urgent': 'bg-yellow-500',
      routine: 'bg-green-500',
    };
    return colors[urgency] || 'bg-gray-500';
  };

  const handleAddSymptom = () => {
    if (currentSymptom.name && currentSymptom.duration) {
      setSymptoms((prev) => [...prev, currentSymptom]);
      setCurrentSymptom({ name: '', severity: 'mild', duration: '' });
      setShowSymptomForm(false);
      addMessage(
        'user',
        `Síntoma: ${currentSymptom.name}\n` +
          `Severidad: ${currentSymptom.severity}\n` +
          `Duración: ${currentSymptom.duration}`,
      );
    }
  };

  const quickSymptoms = [
    '🤕 Dolor de cabeza',
    '🤒 Fiebre',
    '😷 Tos',
    '🤢 Náuseas',
    '💔 Dolor en el pecho',
    '🫁 Dificultad para respirar',
  ];

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Asistente de Triaje Médico</h2>
              <p className="text-sm opacity-90">Evaluación de síntomas 24/7</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white">
            IA Médica
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-primary-500 text-white'
                    : message.type === 'agent'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.data && message.data.urgencyLevel && (
                  <div className="mt-3 space-y-2">
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-white text-sm ${getUrgencyColor(message.data.urgencyLevel)}`}
                    >
                      {getUrgencyLabel(message.data.urgencyLevel)}
                    </div>

                    {message.data.urgencyLevel === 'emergency' && (
                      <Card className="mt-3 p-3 bg-red-50 border-red-200">
                        <div className="flex items-center space-x-2 text-red-700">
                          <Phone className="w-5 h-5" />
                          <span className="font-bold">Llamar 911 Inmediatamente</span>
                        </div>
                      </Card>
                    )}

                    {message.data.urgencyLevel === 'urgent' && (
                      <Card className="mt-3 p-3 bg-orange-50 border-orange-200">
                        <div className="flex items-center space-x-2 text-orange-700">
                          <MapPin className="w-5 h-5" />
                          <span>Buscar centro de urgencias más cercano</span>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
                <div className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Symptom Form Modal */}
      {showSymptomForm && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <h3 className="font-semibold mb-2">Detalles del síntoma</h3>
          <div className="space-y-2">
            <Input
              placeholder="Describe el síntoma"
              value={currentSymptom.name}
              onChange={(e) => setCurrentSymptom((prev) => ({ ...prev, name: e.target.value }))}
            />
            <div className="flex space-x-2">
              <select
                className="flex-1 p-2 border rounded-lg"
                value={currentSymptom.severity}
                onChange={(e) =>
                  setCurrentSymptom((prev) => ({
                    ...prev,
                    severity: e.target.value as 'mild' | 'moderate' | 'severe',
                  }))
                }
              >
                <option value="mild">Leve</option>
                <option value="moderate">Moderado</option>
                <option value="severe">Severo</option>
              </select>
              <Input
                className="flex-1"
                placeholder="¿Desde cuándo? (ej: 2 días)"
                value={currentSymptom.duration}
                onChange={(e) =>
                  setCurrentSymptom((prev) => ({ ...prev, duration: e.target.value }))
                }
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddSymptom}
                disabled={!currentSymptom.name || !currentSymptom.duration}
              >
                Agregar síntoma
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSymptomForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Symptoms */}
      {symptoms.length === 0 && !showSymptomForm && (
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-600 mb-2">Síntomas comunes:</p>
          <div className="flex flex-wrap gap-2">
            {quickSymptoms.map((symptom) => (
              <button
                key={symptom}
                onClick={() => {
                  setInput(symptom.replace(/^[^\s]+ /, ''));
                  inputRef.current?.focus();
                }}
                className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-100 transition-colors"
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Symptoms */}
      {symptoms.length > 0 && (
        <div className="p-4 bg-green-50 border-t border-green-200">
          <p className="text-sm font-semibold text-green-800 mb-2">
            Síntomas registrados ({symptoms.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {symptoms.map((symptom, index) => (
              <Badge key={index} variant="secondary">
                {symptom.name} - {symptom.severity}
              </Badge>
            ))}
          </div>
          <Button className="mt-2" variant="primary" size="sm" onClick={() => handleSendMessage()}>
            Evaluar síntomas
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Describe tus síntomas o responde las preguntas..."
            className="flex-1 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!input.trim() && symptoms.length === 0)}
            variant="primary"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Esta evaluación no reemplaza una consulta médica profesional</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Respuesta en segundos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
