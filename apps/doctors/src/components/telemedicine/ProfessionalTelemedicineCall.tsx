'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTelemedicineDoctorHybrid } from '../../hooks/useTelemedicineDoctorHybrid';
import { useWebRTCDoctorHybrid } from '../../hooks/useWebRTCDoctorHybrid';
import { MedicalNotesSystem } from '../medical-notes/MedicalNotesSystem';
import { Video, Mic, PhoneOff, MessageSquare, User, Bot, Clipboard, Shield, Wifi, Settings } from 'lucide-react';

import { logger } from '@altamedica/shared/services/logger.service';
// --- Sub-componentes de la UI ---

const VideoPanel = ({ localStream, remoteStream, connectionState, isConnected }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <video ref={localVideoRef} autoPlay playsInline muted className="absolute w-48 h-36 bottom-4 right-4 border-2 border-white rounded-lg object-cover" />
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span>{connectionState}</span>
      </div>
    </div>
  );
};

const ChatPanel = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messageEndRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 p-4">
      <h3 className="text-lg font-bold mb-4 text-white">Chat de Consulta</h3>
      <div className="flex-grow overflow-y-auto mb-4 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start mb-3 ${msg.senderRole === 'doctor' ? 'justify-end' : ''}`}>
            <div className={`p-3 rounded-lg max-w-xs ${
              msg.senderRole === 'doctor' 
                ? 'bg-blue-600 text-white' 
                : msg.messageType === 'medical_note'
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-200'
            }`}>
              <p className="text-sm">{msg.message}</p>
              {msg.messageType === 'medical_note' && (
                <p className="text-xs opacity-70 mt-1">Nota Médica</p>
              )}
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-grow bg-gray-700 text-white rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Escribe un mensaje..."
        />
        <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700">
          Enviar
        </button>
      </div>
    </div>
  );
};

const MedicalNotesPanel = ({ notes, onNotesChange }) => (
  <div className="h-full bg-gray-800 p-4">
    <h3 className="text-lg font-bold mb-4 text-white">Notas Médicas (Privadas)</h3>
    <textarea
      value={notes}
      onChange={(e) => onNotesChange(e.target.value)}
      className="w-full h-5/6 bg-gray-700 text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Escriba aquí sus notas, diagnósticos y plan de tratamiento..."
    />
  </div>
);

const AIDiagnosticsPanel = ({ aiAnalysis, onAnalyze, isAnalyzing }) => (
  <div className="h-full bg-gray-800 p-4">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold text-white">Asistente de Diagnóstico IA</h3>
      <button onClick={onAnalyze} disabled={isAnalyzing} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-500">
        {isAnalyzing ? 'Analizando...' : 'Analizar Síntomas'}
      </button>
    </div>
    {aiAnalysis ? (
      <div className="overflow-y-auto h-5/6 pr-2 text-sm">
        <h4 className="font-bold text-blue-400">Posibles Condiciones (Confianza: {Math.round(aiAnalysis.confidence * 100)}%)</h4>
        <ul className="list-disc list-inside mb-3">
          {aiAnalysis.possibleConditions.map(c => <li key={c.condition} className="text-gray-300">{c.condition} ({Math.round(c.probability * 100)}%)</li>)}
        </ul>
        <h4 className="font-bold text-blue-400">Recomendaciones</h4>
        <p className="text-gray-300 bg-gray-700 p-2 rounded">{aiAnalysis.recommendations.join(', ')}</p>
      </div>
    ) : (
      <div className="text-gray-400">Los resultados del análisis de IA aparecerán aquí.</div>
    )}
  </div>
);

const CallControls = ({ onHangUp, onToggleAudio, onToggleVideo, isAudioMuted, isVideoMuted }) => (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800 bg-opacity-80 p-3 rounded-full">
        <button onClick={onToggleAudio} className={`p-3 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-gray-600'} text-white hover:bg-gray-500`}>
            <Mic className="w-6 h-6" />
        </button>
        <button onClick={onToggleVideo} className={`p-3 rounded-full ${isVideoMuted ? 'bg-red-500' : 'bg-gray-600'} text-white hover:bg-gray-500`}>
            <Video className="w-6 h-6" />
        </button>
        <button onClick={onHangUp} className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700">
            <PhoneOff className="w-6 h-6" />
        </button>
    </div>
);


// --- Componente Principal ---

export const ProfessionalTelemedicineCall = ({ sessionId, doctorId, patientId }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  
  // Hook híbrido de telemedicina
  const telemedicineHook = useTelemedicineDoctorHybrid({
    doctorId,
    doctorName: 'Dr. Usuario', // TODO: obtener del contexto de auth
    specialty: 'Medicina General', // TODO: obtener del contexto de auth
    signaling: { url: 'ws://localhost:8888' },
    firebase: { enabled: true },
    medical: {
      autoSaveInterval: 30000,
      requireConsentForRecording: true,
      enableAuditTrail: true,
      hipaaMode: true
    }
  });

  // Hook híbrido WebRTC
  const webrtcHook = useWebRTCDoctorHybrid({
    sessionId,
    doctorId,
    patientId,
    socket: telemedicineHook.socket,
    firebase: { enabled: true },
    medical: {
      enableRecording: true,
      requireConsent: true,
      encryptStreams: true,
      qualityMonitoring: true,
      hipaaMode: true,
      autoSaveRecordings: true
    }
  });

  // Inicializar sesión al montar
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await telemedicineHook.joinSession(sessionId);
        await webrtcHook.startCall();
      } catch (error) {
        logger.error('Error inicializando sesión:', error);
      }
    };

    initializeSession();

    return () => {
      telemedicineHook.leaveSession();
      webrtcHook.endCall();
    };
  }, [sessionId]);

  // Simular análisis de IA
  const analyzeSymptoms = useCallback(async () => {
    setIsAnalyzing(true);
    
    // Simular análisis de IA basado en los mensajes del chat
    setTimeout(() => {
      const mockAnalysis = {
        confidence: 0.75,
        possibleConditions: [
          { condition: 'Gripe común', probability: 0.6 },
          { condition: 'Infección respiratoria leve', probability: 0.3 },
          { condition: 'Alergia estacional', probability: 0.1 }
        ],
        recommendations: [
          'Recomendar reposo y hidratación',
          'Considerar antipirético si hay fiebre',
          'Seguimiento en 3-5 días'
        ]
      };
      
      setAiAnalysis(mockAnalysis);
      setIsAnalyzing(false);
    }, 2000);
  }, []);

  const handleHangUp = useCallback(async () => {
    try {
      const sessionSummary = {
        diagnosis: medicalNotes.substring(0, 500), // Primeras líneas como diagnóstico
        treatmentPlan: medicalNotes,
        notes: medicalNotes,
        duration: Math.floor(Date.now() / 1000),
        patientSatisfaction: 5
      };

      await telemedicineHook.endSession(sessionId, sessionSummary);
      await webrtcHook.endCall();
    } catch (error) {
      logger.error('Error finalizando llamada:', error);
    }
  }, [sessionId, medicalNotes, telemedicineHook, webrtcHook]);

  if (telemedicineHook.error || webrtcHook.error) {
    return <div className="text-red-500 text-center p-8">Error: {telemedicineHook.error || webrtcHook.error}</div>;
  }

  if (!telemedicineHook.session || telemedicineHook.isLoading) {
    return <div className="text-white text-center p-8">Cargando sesión...</div>;
  }

  const tabs = {
    chat: <ChatPanel messages={telemedicineHook.chatMessages} onSendMessage={telemedicineHook.sendMessage} />,
    notes: (
      <MedicalNotesSystem
        sessionId={sessionId}
        patientId={patientId}
        doctorId={doctorId}
        doctorName="Dr. Usuario" // TODO: obtener del contexto
        specialty="Medicina General" // TODO: obtener del contexto
        compactMode={true}
        onNoteCreated={(note) => {
          logger.info('Nueva nota médica creada:', note);
          // Integrar con el sistema de telemedicina si es necesario
        }}
        onNoteUpdated={(note) => {
          logger.info('Nota médica actualizada:', note);
          // Actualizar datos de la sesión si es necesario
        }}
      />
    ),
    diagnostics: <AIDiagnosticsPanel aiAnalysis={aiAnalysis} onAnalyze={analyzeSymptoms} isAnalyzing={isAnalyzing} />,
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex p-4 gap-4">
      <div className="flex-grow h-full relative">
        <VideoPanel 
          localStream={webrtcHook.localStream} 
          remoteStream={webrtcHook.remoteStream} 
          connectionState={webrtcHook.connectionState}
          isConnected={webrtcHook.isConnected}
        />
        <CallControls 
          onHangUp={handleHangUp}
          onToggleAudio={webrtcHook.toggleAudio}
          onToggleVideo={webrtcHook.toggleVideo}
          isAudioMuted={!webrtcHook.isAudioEnabled}
          isVideoMuted={!webrtcHook.isVideoEnabled}
        />
      </div>
      <div className="w-1/3 h-full flex flex-col bg-gray-800 rounded-lg">
        <div className="flex border-b border-gray-700">
          {Object.keys(tabs).map(tabName => (
            <button
              key={tabName}
              onClick={() => setActiveTab(tabName)}
              className={`flex-1 py-3 px-2 text-sm font-bold capitalize flex items-center justify-center gap-2 ${activeTab === tabName ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              {tabName === 'chat' && <MessageSquare size={16} />}
              {tabName === 'notes' && <Clipboard size={16} />}
              {tabName === 'diagnostics' && <Bot size={16} />}
              {tabName}
            </button>
          ))}
        </div>
        <div className="flex-grow">
          {tabs[activeTab]}
        </div>
      </div>
    </div>
  );
};