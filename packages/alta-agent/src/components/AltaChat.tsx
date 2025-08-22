/**
 * 🏥 ALTA CHAT - Interfaz de Chat con Alta
 * Asistente Médica de Anamnesis
 * Desarrollado por Dr. Eduardo Marques (Medicina-UBA)
 */

import { logger } from '../logger.js';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Download, Mic, MicOff, RefreshCw, Send, User, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AltaAgent } from '../core/AltaAgent';
import { AltaAgentWithAI } from '../core/AltaAgentWithAI';
import type { AltaEmotion, AltaResponse, AltaState } from '../types/alta.types';
import { AltaAvatar3D } from './AltaAvatar3D';


export interface AltaChatProps {
  patientId: string;
  onSessionComplete?: (summary: string) => void;
  enableVoice?: boolean;
  enableAvatar?: boolean;
  className?: string;
  height?: string;
}

export function AltaChat({
  patientId,
  onSessionComplete,
  enableVoice = true,
  enableAvatar = true,
  className = '',
  height = '600px',
}: AltaChatProps) {
  // Estado del chat
  const [messages, setMessages] = useState<AltaResponse[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  // Estado de Alta
  const [altaState, setAltaState] = useState<AltaState>('idle');
  const [altaEmotion, setAltaEmotion] = useState<AltaEmotion>('neutral');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Referencias
  const chatEndRef = useRef<HTMLDivElement>(null);
  const altaAgentRef = useRef<AltaAgent | AltaAgentWithAI | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Inicializar Alta
  useEffect(() => {
    const initAlta = async () => {
      // Usar versión con IA si las APIs están disponibles
      const useAI =
        process.env.NEXT_PUBLIC_MANUS_API_KEY || process.env.NEXT_PUBLIC_GENSPARK_API_KEY;

      const agent = useAI
        ? new AltaAgentWithAI({
            name: 'Alta',
            developer: 'Dr. Eduardo Marques',
            credentials: 'Medicina-UBA',
          })
        : new AltaAgent({
            name: 'Alta',
            developer: 'Dr. Eduardo Marques',
            credentials: 'Medicina-UBA',
          });

      if (useAI) {
        logger.info('🤖 Alta initialized with AI capabilities (Manus/GenSpark)');
      }

      // Suscribirse a eventos
      agent.on('state.changed', (state: AltaState) => setAltaState(state));
      agent.on('emotion.changed', (emotion: AltaEmotion) => setAltaEmotion(emotion));
      agent.on('urgency.detected', handleUrgencyDetected);
      agent.on('session.end', handleSessionEnd);

      altaAgentRef.current = agent;

      // Iniciar sesión automáticamente
      await startSession();
    };

    initAlta();

    // Cleanup
    return () => {
      if (altaAgentRef.current) {
        altaAgentRef.current.removeAllListeners();
        altaAgentRef.current.endSession();
      }
    };
  }, [patientId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Iniciar sesión con Alta
  const startSession = async () => {
    if (!altaAgentRef.current || sessionActive) return;

    const welcomeMessage = await altaAgentRef.current.startSession(patientId);

    setMessages([
      {
        id: Date.now().toString(),
        timestamp: new Date(),
        speaker: 'alta',
        content: welcomeMessage.text,
        emotion: welcomeMessage.emotion,
      },
    ]);

    setSessionActive(true);

    // Speak de bienvenida si está habilitado
    if (enableVoice && !isMuted) {
      speak(welcomeMessage.text);
    }
  };

  // Enviar mensaje
  const sendMessage = async () => {
    if (!inputValue.trim() || !altaAgentRef.current || !sessionActive) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Agregar mensaje del usuario
    const userResponse: AltaResponse = {
      id: Date.now().toString(),
      timestamp: new Date(),
      speaker: 'patient',
      content: userMessage,
    };

    setMessages((prev) => [...prev, userResponse]);
    setIsTyping(true);

    try {
      // Procesar con Alta
      const altaResponse = await altaAgentRef.current.processMessage(userMessage);

      // Agregar respuesta de Alta
      const altaMsg: AltaResponse = {
        id: (Date.now() + 1).toString(),
        timestamp: new Date(),
        speaker: 'alta',
        content: altaResponse.text,
        emotion: altaResponse.emotion,
      };

      setMessages((prev) => [...prev, altaMsg]);

      // Hablar si está habilitado
      if (enableVoice && !isMuted) {
        speak(altaResponse.text);
      }
    } catch (error) {
      logger.error('Error procesando mensaje:', error);

      // Mensaje de error
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          timestamp: new Date(),
          speaker: 'alta',
          content: 'Disculpá, tuve un problema procesando tu mensaje. ¿Podrías repetirlo?',
          emotion: 'concerned',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Text-to-Speech
  const speak = (text: string) => {
    if (!window.speechSynthesis || isMuted) return;

    // Cancelar síntesis anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'es-AR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');

      setInputValue(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (inputValue.trim()) {
        sendMessage();
      }
    };

    recognition.onerror = (event: any) => {
      logger.error('Error de reconocimiento:', event.error);
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Manejar detección de urgencia
  const handleUrgencyDetected = (data: any) => {
    logger.warn('⚠️ Urgencia detectada:', data);

    // Mostrar alerta especial
    const alertMessage: AltaResponse = {
      id: 'alert-' + Date.now(),
      timestamp: new Date(),
      speaker: 'alta',
      content: `⚠️ ATENCIÓN: ${data.recommendations?.join('. ')}`,
      emotion: 'urgent',
    };

    setMessages((prev) => [...prev, alertMessage]);
  };

  // Manejar fin de sesión
  const handleSessionEnd = (data: any) => {
    setSessionActive(false);
    if (onSessionComplete) {
      onSessionComplete(data.summary);
    }
  };

  // Descargar resumen
  const downloadSummary = async () => {
    if (!altaAgentRef.current) return;

    const summary = await altaAgentRef.current.generateSummary();

    const blob = new Blob([summary], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alta-anamnesis-${patientId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reiniciar sesión
  const restartSession = async () => {
    if (altaAgentRef.current) {
      await altaAgentRef.current.endSession();
      setMessages([]);
      await startSession();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-lg shadow-lg ${className}`} style={{ height }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="w-8 h-8" />
            <span
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                sessionActive ? 'bg-green-400' : 'bg-gray-400'
              } animate-pulse`}
            />
          </div>
          <div>
            <h2 className="font-bold text-lg">Alta</h2>
            <p className="text-xs opacity-90">Asistente Médica • Dr. E. Marques (UBA)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={downloadSummary}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Descargar resumen"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={restartSession}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Reiniciar sesión"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Avatar Section */}
        {enableAvatar && (
          <div className="w-1/3 border-r bg-gradient-to-b from-blue-50 to-white">
            <AltaAvatar3D
              emotion={altaEmotion}
              state={altaState}
              
              className="h-full"
            />
          </div>
        )}

        {/* Chat Section */}
        <div className={`flex-1 flex flex-col ${enableAvatar ? '' : 'w-full'}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.speaker === 'patient' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      message.speaker === 'patient' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.speaker === 'alta'
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {message.speaker === 'alta' ? (
                        <Bot className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.speaker === 'alta'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>

                      {/* Timestamp */}
                      <p
                        className={`text-xs mt-1 ${
                          message.speaker === 'alta' ? 'text-gray-500' : 'text-blue-100'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <div
                className="flex items-center space-x-2 text-gray-500"
              >
                <Bot className="w-5 h-5" />
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              {/* Voice Input */}
              {enableVoice && (
                <button
                  onClick={toggleListening}
                  className={`p-3 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title={isListening ? 'Detener grabación' : 'Hablar'}
                >
                  {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
              )}

              {/* Text Input */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribí tu mensaje o usá el micrófono..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!sessionActive || isListening}
              />

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || !sessionActive}
                className={`p-3 rounded-lg transition-colors ${
                  inputValue.trim() && sessionActive
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Replies */}
            {messages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {['Me siento bien', 'Tengo dolor', 'Necesito ayuda', 'Siguiente pregunta'].map(
                  (reply) => (
                    <button
                      key={reply}
                      onClick={() => {
                        setInputValue(reply);
                        sendMessage();
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      {reply}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AltaChat;
