"use client";

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DoctorVideoCall from '../../../components/telemedicine/DoctorVideoCall';
import ChatPanel from '../../../components/telemedicine/ChatPanel';
import SessionControls from '../../../components/telemedicine/SessionControls';
import { User, Calendar, Clock, ArrowLeft, AlertCircle, Stethoscope } from "lucide-react";

import { logger } from '@altamedica/shared/services/logger.service';
// Datos mock para la sesión
const sessionMock = {
  id: "tm-001",
  patientName: "Carlos Rodríguez",
  patientAge: "45 años",
  specialty: "Cardiología",
  date: "2025-07-01",
  time: "15:00",
  status: "active",
  notes: "Consulta de seguimiento - Hipertensión arterial",
  vitalSigns: {
    bloodPressure: "140/90",
    heartRate: "72",
    temperature: "36.8",
    oxygenSaturation: "98%"
  }
};

export default function DoctorTelemedicineSessionPage() {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState("waiting");
  const [error, setError] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);

  const handleStartCall = () => {
    setIsInCall(true);
    setSessionStatus("active");
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setSessionStatus("ended");
    logger.info("Sesión finalizada");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    logger.error("Error en la sesión:", errorMessage);
  };

  const handleSendMessage = (message: string) => {
    logger.info("Mensaje enviado:", message);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-4 flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-blue-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex items-center">
          <Stethoscope className="w-6 h-6 mr-2 text-blue-600" />
          Consulta de Telemedicina
        </h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Panel principal: Videollamada y controles */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Información del Paciente */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-lg">
                  {sessionMock.patientName}
                </div>
                <div className="text-sm text-gray-600">
                  {sessionMock.patientAge} • {sessionMock.specialty}
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {sessionMock.date}
                  <Clock className="w-4 h-4 ml-4 mr-1" />
                  {sessionMock.time}
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  sessionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {sessionStatus === 'active' ? 'En Consulta' : 'Esperando'}
                </div>
              </div>
            </div>

            {/* Signos Vitales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600 font-medium">Presión Arterial</div>
                <div className="text-lg font-semibold text-blue-900">{sessionMock.vitalSigns.bloodPressure}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-xs text-red-600 font-medium">Frecuencia Cardíaca</div>
                <div className="text-lg font-semibold text-red-900">{sessionMock.vitalSigns.heartRate} bpm</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 font-medium">Temperatura</div>
                <div className="text-lg font-semibold text-green-900">{sessionMock.vitalSigns.temperature}°C</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-xs text-purple-600 font-medium">Saturación O2</div>
                <div className="text-lg font-semibold text-purple-900">{sessionMock.vitalSigns.oxygenSaturation}</div>
              </div>
            </div>
            
            {/* Componente de Videollamada */}
            {isInCall ? (
              <DoctorVideoCall
                roomId={sessionMock.id}
                patientId="patient-456"
                patientName={sessionMock.patientName}
                onEndCall={handleEndCall}
                onError={handleError}
                showControls={true}
                showStats={true}
                className="h-96"
              />
            ) : (
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="w-16 h-16 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Listo para iniciar consulta
                  </h3>
                  <p className="text-gray-600 mb-4">
                    El paciente está esperando para conectarse
                  </p>
                  <button
                    onClick={handleStartCall}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    🎥 Iniciar Consulta
                  </button>
                </div>
              </div>
            )}
            
            {/* Controles de Sesión */}
            <SessionControls
              sessionId={sessionMock.id}
              status={sessionStatus}
            />
          </div>
        </div>

        {/* Panel lateral: Chat y notas */}
        <div className="space-y-6">
          {/* Chat */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Chat con Paciente
            </h2>
            <ChatPanel 
              sessionId={sessionMock.id}
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Notas Médicas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Notas de Consulta
            </h2>
            <div className="space-y-4">
              <textarea
                placeholder="Escribir notas médicas..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700">
                  Guardar Nota
                </button>
                <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-gray-700">
                  Receta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 