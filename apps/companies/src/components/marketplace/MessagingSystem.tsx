'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useAuth  } from '@altamedica/auth';
import { useEffect, useRef, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'company' | 'doctor';
  content: string;
  timestamp: string;
  type: 'text' | 'job_offer' | 'interview_request' | 'contract' | 'file';
  metadata?: {
    jobId?: string;
    jobTitle?: string;
    fileName?: string;
    fileUrl?: string;
    interviewDate?: string;
    salary?: string;
  };
  isRead: boolean;
}

interface Chat {
  id: string;
  participants: {
    doctor: {
      id: string;
      name: string;
      specialty: string;
      avatar?: string;
    };
    company: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  lastMessage: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
}

interface MessagingSystemProps {
  onClose: () => void;
}

export default function MessagingSystem({ onClose }: MessagingSystemProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data para demostración
  useEffect(() => {
    const mockChats: Chat[] = [
      {
        id: 'chat-1',
        participants: {
          doctor: {
            id: 'dr-martinez-001',
            name: 'Dr. Carlos Martínez',
            specialty: 'Cardiología',
            avatar: '/doctor-martinez.jpg',
          },
          company: {
            id: 'hospital-san-vicente-001',
            name: 'Hospital San Vicente',
            avatar: '/hospital-san-vicente-logo.png',
          },
        },
        lastMessage: {
          id: 'msg-1',
          senderId: 'dr-martinez-001',
          senderName: 'Dr. Carlos Martínez',
          senderType: 'doctor',
          content:
            'Gracias por la oferta. Me interesa mucho la posición de cardiólogo intervencionista.',
          timestamp: '2025-08-07T10:30:00Z',
          type: 'text',
          isRead: false,
        },
        unreadCount: 2,
        isActive: true,
        createdAt: '2025-08-06T09:00:00Z',
      },
      {
        id: 'chat-2',
        participants: {
          doctor: {
            id: 'dr-lopez-002',
            name: 'Dra. María López',
            specialty: 'Pediatría',
            avatar: '/doctor-lopez.jpg',
          },
          company: {
            id: 'hospital-san-vicente-001',
            name: 'Hospital San Vicente',
            avatar: '/hospital-san-vicente-logo.png',
          },
        },
        lastMessage: {
          id: 'msg-2',
          senderId: 'company-1',
          senderName: 'Hospital San Vicente',
          senderType: 'company',
          content: 'Perfecto, programemos la entrevista para el viernes a las 10:00 AM.',
          timestamp: '2025-08-07T09:15:00Z',
          type: 'interview_request',
          metadata: {
            interviewDate: '2025-08-09T10:00:00Z',
            jobTitle: 'Pediatra - Telemedicina',
          },
          isRead: true,
        },
        unreadCount: 0,
        isActive: true,
        createdAt: '2025-08-05T14:30:00Z',
      },
    ];

    setChats(mockChats);
    setSelectedChat(mockChats[0]);
  }, []);

  // Mock messages para el chat seleccionado
  useEffect(() => {
    if (selectedChat) {
      const mockMessages: Message[] = [
        {
          id: 'msg-start',
          senderId: 'system',
          senderName: 'Sistema',
          senderType: 'company',
          content: `Conversación iniciada entre ${selectedChat.participants.company.name} y ${selectedChat.participants.doctor.name}`,
          timestamp: selectedChat.createdAt,
          type: 'text',
          isRead: true,
        },
        {
          id: 'msg-offer',
          senderId: selectedChat.participants.company.id,
          senderName: selectedChat.participants.company.name,
          senderType: 'company',
          content:
            'Hola Dr. Martínez, hemos revisado su perfil y nos gustaría ofrecerle la posición de Cardiólogo Intervencionista en nuestro hospital.',
          timestamp: '2025-08-06T09:30:00Z',
          type: 'job_offer',
          metadata: {
            jobTitle: 'Cardiólogo Intervencionista Senior',
            salary: 'USD 12,000 - 18,000 mensual',
          },
          isRead: true,
        },
        {
          id: 'msg-response',
          senderId: selectedChat.participants.doctor.id,
          senderName: selectedChat.participants.doctor.name,
          senderType: 'doctor',
          content:
            'Muchas gracias por considerarme. Me interesa mucho la posición. ¿Podrían proporcionarme más detalles sobre el horario y las responsabilidades específicas?',
          timestamp: '2025-08-06T15:45:00Z',
          type: 'text',
          isRead: true,
        },
        {
          id: 'msg-details',
          senderId: selectedChat.participants.company.id,
          senderName: selectedChat.participants.company.name,
          senderType: 'company',
          content:
            'Por supuesto. El horario incluye guardias rotativas y el foco principal será en procedimientos de angioplastia y cateterismo cardíaco. Adjunto el documento con todos los detalles.',
          timestamp: '2025-08-07T08:20:00Z',
          type: 'file',
          metadata: {
            fileName: 'Descripción_Puesto_Cardiólogo.pdf',
            fileUrl: '/files/job-description.pdf',
          },
          isRead: true,
        },
        {
          id: 'msg-latest',
          senderId: selectedChat.participants.doctor.id,
          senderName: selectedChat.participants.doctor.name,
          senderType: 'doctor',
          content:
            'Gracias por la oferta. Me interesa mucho la posición de cardiólogo intervencionista.',
          timestamp: '2025-08-07T10:30:00Z',
          type: 'text',
          isRead: false,
        },
      ];

      setMessages(mockMessages);
    }
  }, [selectedChat]);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setIsLoading(true);
    try {
      const message: Message = {
        id: `msg-${Date.now()}`,
        senderId: user?.id || 'current-user',
        senderName:
          (user as any)?.name ||
          (user as any)?.displayName ||
          (user as any)?.email ||
          'Usuario Actual',
        senderType: 'company',
        content: newMessage,
        timestamp: new Date().toISOString(),
        type: 'text',
        isRead: false,
      };

      setMessages((prev) => [...prev, message]);
      setNewMessage('');

      // Simular respuesta (en producción esto vendría del WebSocket)
      setTimeout(() => {
        const autoReply: Message = {
          id: `msg-reply-${Date.now()}`,
          senderId: selectedChat.participants.doctor.id,
          senderName: selectedChat.participants.doctor.name,
          senderType: 'doctor',
          content: 'Gracias por su mensaje. Responderé pronto.',
          timestamp: new Date().toISOString(),
          type: 'text',
          isRead: false,
        };
        setMessages((prev) => [...prev, autoReply]);
      }, 2000);
    } catch (error) {
      logger.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return `Ayer ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays > 1) {
      return date.toLocaleDateString('es-ES');
    } else {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderType === 'company';

    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
          }`}
        >
          {message.type === 'job_offer' && (
            <div className="mb-2 p-2 bg-white bg-opacity-20 rounded border">
              <div className="text-xs font-semibold uppercase tracking-wider mb-1">
                💼 Oferta de Trabajo
              </div>
              <div className="text-sm">
                <div className="font-medium">{message.metadata?.jobTitle}</div>
                <div className="text-xs opacity-90">{message.metadata?.salary}</div>
              </div>
            </div>
          )}

          {message.type === 'interview_request' && (
            <div className="mb-2 p-2 bg-white bg-opacity-20 rounded border">
              <div className="text-xs font-semibold uppercase tracking-wider mb-1">
                🎤 Entrevista Programada
              </div>
              <div className="text-sm">
                <div className="font-medium">{message.metadata?.jobTitle}</div>
                <div className="text-xs opacity-90">
                  {message.metadata?.interviewDate &&
                    new Date(message.metadata.interviewDate).toLocaleString('es-ES')}
                </div>
              </div>
            </div>
          )}

          {message.type === 'file' && (
            <div className="mb-2 p-2 bg-white bg-opacity-20 rounded border flex items-center">
              <span className="text-lg mr-2">📎</span>
              <div>
                <div className="text-sm font-medium">{message.metadata?.fileName}</div>
                <div className="text-xs opacity-90">Archivo adjunto</div>
              </div>
            </div>
          )}

          <div className="text-sm">{message.content}</div>
          <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatTimestamp(message.timestamp)}
            {!message.isRead && isOwnMessage && <span className="ml-1">●</span>}
          </div>
        </div>
      </div>
    );
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.participants.doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.participants.doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-5/6 flex overflow-hidden">
        {/* Lista de chats */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mensajes</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg">👨‍⚕️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {chat.participants.doctor.name}
                      </h3>
                      {chat.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{chat.participants.doctor.specialty}</p>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {chat.lastMessage.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(chat.lastMessage.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Área de chat */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Header del chat */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg">👨‍⚕️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedChat.participants.doctor.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedChat.participants.doctor.specialty}
                    </p>
                  </div>
                  <div className="flex-1"></div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      📹 Videollamada
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                      📞 Llamar
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '...' : 'Enviar'}
                  </button>
                </div>

                <div className="flex items-center mt-2 space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">📎 Adjuntar</button>
                  <button className="text-gray-400 hover:text-gray-600">😊 Emojis</button>
                  <button className="text-gray-400 hover:text-gray-600">💼 Enviar Oferta</button>
                  <button className="text-gray-400 hover:text-gray-600">
                    🎤 Programar Entrevista
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium">Selecciona una conversación</h3>
                <p className="text-sm">Elige un chat para comenzar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
