'use client';

import React, { useEffect, useState } from 'react';

import { logger } from '@altamedica/shared';
interface Message {
  id: string;
  sender: string;
  senderType: 'patient' | 'doctor' | 'nurse' | 'admin';
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  isOnline: boolean;
  lastSeen?: Date;
  avatar?: string;
}

interface TeamCommunicationProps {
  patientId: string;
  compact?: boolean;
  onSendMessage?: (message: string, recipients: string[]) => void;
  onEmergencyContact?: () => void;
}

const TeamCommunication: React.FC<TeamCommunicationProps> = ({
  patientId,
  compact = false,
  onSendMessage,
  onEmergencyContact,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAllMessages, setShowAllMessages] = useState(false);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Simular carga de datos
        const mockTeamMembers: TeamMember[] = [
          {
            id: '1',
            name: 'Dr. María García',
            role: 'Médico Principal',
            specialty: 'Medicina Interna',
            isOnline: true,
            avatar: '👩‍⚕️',
          },
          {
            id: '2',
            name: 'Dr. Carlos López',
            role: 'Cardiólogo',
            specialty: 'Cardiología',
            isOnline: false,
            lastSeen: new Date(Date.now() - 2 * 3600000),
            avatar: '👨‍⚕️',
          },
          {
            id: '3',
            name: 'Enf. Ana Martínez',
            role: 'Enfermera',
            specialty: 'Cuidados Intensivos',
            isOnline: true,
            avatar: '👩‍⚕️',
          },
          {
            id: '4',
            name: 'Dr. Roberto Silva',
            role: 'Endocrinólogo',
            specialty: 'Endocrinología',
            isOnline: true,
            avatar: '👨‍⚕️',
          },
        ];

        const mockMessages: Message[] = [
          {
            id: '1',
            sender: 'Dr. María García',
            senderType: 'doctor',
            content: 'Hola, ¿cómo se siente hoy? ¿Ha notado algún cambio en sus síntomas?',
            timestamp: new Date(Date.now() - 30 * 60000),
            isRead: true,
          },
          {
            id: '2',
            sender: 'Paciente',
            senderType: 'patient',
            content:
              'Buenos días doctora. Me siento un poco mejor, pero aún tengo dolor de cabeza.',
            timestamp: new Date(Date.now() - 25 * 60000),
            isRead: true,
          },
          {
            id: '3',
            sender: 'Dr. María García',
            senderType: 'doctor',
            content:
              'Entiendo. ¿El dolor es constante o intermitente? ¿Ha tomado el medicamento que le receté?',
            timestamp: new Date(Date.now() - 20 * 60000),
            isRead: false,
          },
          {
            id: '4',
            sender: 'Enf. Ana Martínez',
            senderType: 'nurse',
            content: 'Le envío un recordatorio: su próxima cita es mañana a las 10:00 AM.',
            timestamp: new Date(Date.now() - 10 * 60000),
            isRead: false,
          },
        ];

        setTeamMembers(mockTeamMembers);
        setMessages(mockMessages);
      } catch (error) {
        logger.error('Error cargando datos:', error as string);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  // Enviar mensaje
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'Paciente',
      senderType: 'patient',
      content: newMessage,
      timestamp: new Date(),
      isRead: false,
    };

    setMessages((prev) => [message, ...prev]);
    setNewMessage('');
    onSendMessage?.(newMessage, selectedMember ? [selectedMember] : []);
  };

  // Obtener icono según tipo de remitente
  const getSenderIcon = (senderType: 'doctor' | 'nurse' | 'admin' | 'patient') => {
    const icons: Record<'doctor' | 'nurse' | 'admin' | 'patient', string> = {
      doctor: '👨‍⚕️',
      nurse: '👩‍⚕️',
      admin: '👨‍💼',
      patient: '👤',
    };
    return icons[senderType] || '👤';
  };

  // Vista compacta
  if (compact) {
    const unreadCount = messages.filter((m) => !m.isRead && m.senderType !== 'patient').length;
    const recentMessages = messages.slice(0, 3);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Comunicación</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {unreadCount} sin leer
            </span>
          )}
        </div>

        {recentMessages.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">💬</span>
            <p className="text-gray-500">No hay mensajes recientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMessages.map((message) => (
              <div
                key={message.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-xl">{getSenderIcon(message.senderType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 text-sm">{message.sender}</p>
                    {!message.isRead && message.senderType !== 'patient' && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {messages.length > 3 && (
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Ver {messages.length - 3} mensajes más...
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vista completa
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Comunicación con el Equipo</h2>
            <p className="text-sm text-gray-600 mt-1">
              {teamMembers.filter((m) => m.isOnline).length} miembros en línea
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {onEmergencyContact && (
              <button
                onClick={onEmergencyContact}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                <span className="mr-2">🚨</span>
                Emergencia
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Lista de miembros del equipo */}
        <div className="w-1/3 border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Miembros del Equipo</h3>
          </div>

          <div className="overflow-y-auto h-full">
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedMember === member.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <span className="text-2xl">{member.avatar}</span>
                    <span
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    ></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{member.name}</p>
                    <p className="text-xs text-gray-600">{member.role}</p>
                    {member.specialty && (
                      <p className="text-xs text-gray-500">{member.specialty}</p>
                    )}
                    {!member.isOnline && member.lastSeen && (
                      <p className="text-xs text-gray-400">
                        Última vez:{' '}
                        {member.lastSeen.toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 flex flex-col">
          {/* Header del chat */}
          {selectedMember && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {teamMembers.find((m) => m.id === selectedMember)?.avatar}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    {teamMembers.find((m) => m.id === selectedMember)?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {teamMembers.find((m) => m.id === selectedMember)?.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedMember ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl mb-3 block">💬</span>
                  <p className="text-gray-500">Seleccione un miembro del equipo para chatear</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages
                  .filter((m) => m.senderType !== 'patient' || selectedMember === 'all')
                  .slice(0, showAllMessages ? undefined : 10)
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'patient' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === 'patient'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm">{getSenderIcon(message.senderType)}</span>
                          <span className="text-xs opacity-75">{message.sender}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderType === 'patient' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                {messages.length > 10 && !showAllMessages && (
                  <button
                    onClick={() => setShowAllMessages(true)}
                    className="w-full py-2 text-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Cargar mensajes anteriores
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Input de mensaje */}
          {selectedMember && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escriba su mensaje..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCommunication;
