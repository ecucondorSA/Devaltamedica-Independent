'use client';

import { Button, Card, Input } from '@altamedica/ui';
import {
    Camera,
    Check,
    CheckCheck,
    Image,
    MessageCircle,
    Mic,
    MoreVertical,
    Paperclip,
    Phone,
    Plus,
    Search,
    Send,
    Settings,
    Star,
    User,
    Video
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'doctor' | 'patient';
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'prescription';
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    type: 'image' | 'document' | 'audio';
    url: string;
    name: string;
    size?: string;
  }[];
  isImportant?: boolean;
}

interface Conversation {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'archived' | 'important';
  isOnline: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
}

// Mock data
const mockConversations: Conversation[] = [
  {
    id: 'conv-001',
    patientId: 'patient-001',
    patientName: 'María González',
    lastMessage: 'Gracias doctor, ya tomé la medicación como me indicó',
    lastMessageTime: '2025-01-29T10:30:00',
    unreadCount: 0,
    status: 'active',
    isOnline: true,
    priority: 'medium',
    tags: ['diabetes', 'seguimiento']
  },
  {
    id: 'conv-002',
    patientId: 'patient-002',
    patientName: 'Carlos Rodriguez',
    lastMessage: '¿Cuándo puedo hacer ejercicio después de la cirugía?',
    lastMessageTime: '2025-01-29T09:15:00',
    unreadCount: 2,
    status: 'active',
    isOnline: false,
    priority: 'high',
    tags: ['post-operatorio', 'cardiología']
  },
  {
    id: 'conv-003',
    patientId: 'patient-003',
    patientName: 'Ana López',
    lastMessage: 'Siento dolor en el pecho, ¿es normal?',
    lastMessageTime: '2025-01-29T08:45:00',
    unreadCount: 1,
    status: 'active',
    isOnline: true,
    priority: 'urgent',
    tags: ['emergencia', 'dolor torácico']
  },
  {
    id: 'conv-004',
    patientId: 'patient-004',
    patientName: 'Pedro Martínez',
    lastMessage: 'Perfecto, nos vemos en la próxima cita',
    lastMessageTime: '2025-01-28T16:20:00',
    unreadCount: 0,
    status: 'active',
    isOnline: false,
    priority: 'low',
    tags: ['seguimiento']
  }
];

const mockMessages: { [key: string]: Message[] } = {
  'conv-001': [
    {
      id: 'msg-001',
      senderId: 'patient-001',
      senderName: 'María González',
      senderRole: 'patient',
      content: 'Buenos días doctor, quería consultarle sobre los efectos secundarios de la metformina',
      timestamp: '2025-01-29T09:00:00',
      type: 'text',
      status: 'read'
    },
    {
      id: 'msg-002',
      senderId: 'doctor-001',
      senderName: 'Dr. Rodriguez',
      senderRole: 'doctor',
      content: 'Buenos días María. ¿Qué tipo de efectos está experimentando? Es importante que me cuente en detalle para poder ayudarla.',
      timestamp: '2025-01-29T09:15:00',
      type: 'text',
      status: 'read'
    },
    {
      id: 'msg-003',
      senderId: 'patient-001',
      senderName: 'María González',
      senderRole: 'patient',
      content: 'Tengo náuseas por las mañanas y a veces dolor de estómago. ¿Es normal?',
      timestamp: '2025-01-29T09:20:00',
      type: 'text',
      status: 'read'
    },
    {
      id: 'msg-004',
      senderId: 'doctor-001',
      senderName: 'Dr. Rodriguez',
      senderRole: 'doctor',
      content: 'Sí, son efectos secundarios comunes al inicio del tratamiento. Le recomiendo tomar la medicación con las comidas y dividir la dosis. Si persiste, podemos ajustar la dosis.',
      timestamp: '2025-01-29T09:25:00',
      type: 'text',
      status: 'read'
    },
    {
      id: 'msg-005',
      senderId: 'patient-001',
      senderName: 'María González',
      senderRole: 'patient',
      content: 'Gracias doctor, ya tomé la medicación como me indicó',
      timestamp: '2025-01-29T10:30:00',
      type: 'text',
      status: 'delivered'
    }
  ],
  'conv-002': [
    {
      id: 'msg-006',
      senderId: 'patient-002',
      senderName: 'Carlos Rodriguez',
      senderRole: 'patient',
      content: 'Doctor, ya pasaron 2 semanas de mi cirugía cardíaca',
      timestamp: '2025-01-29T09:10:00',
      type: 'text',
      status: 'sent'
    },
    {
      id: 'msg-007',
      senderId: 'patient-002',
      senderName: 'Carlos Rodriguez',
      senderRole: 'patient',
      content: '¿Cuándo puedo hacer ejercicio después de la cirugía?',
      timestamp: '2025-01-29T09:15:00',
      type: 'text',
      status: 'sent'
    }
  ]
};

const MessagesPage: React.FC = () => {
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<string | null>('conv-001');
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterPriority === 'all' || conv.priority === filterPriority;
    return matchesSearch && matchesFilter;
  });

  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'doctor-001',
      senderName: 'Dr. Rodriguez',
      senderRole: 'doctor',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sent'
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), message]
    }));

    // Actualizar última mensaje en conversación
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, lastMessage: newMessage, lastMessageTime: new Date().toISOString() }
        : conv
    ));

    setNewMessage('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  };

  const getMessageStatus = (status: string) => {
    switch (status) {
      case 'sent': return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered': return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read': return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
              <p className="text-sm text-gray-600">Comunicación con pacientes</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Settings className="w-4 h-4" />
              </button>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Conversación
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Lista de conversaciones */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            {/* Buscador y filtros */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todas las prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>

            {/* Lista de conversaciones */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation === conversation.id ? 'bg-primary-50 border-r-4 border-r-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{conversation.patientName}</h3>
                        <div className="flex items-center space-x-1">
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">{conversation.lastMessage}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          {conversation.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(conversation.priority)}`}>
                          {conversation.priority === 'urgent' ? 'Urgente' :
                           conversation.priority === 'high' ? 'Alta' :
                           conversation.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron conversaciones</p>
                </div>
              )}
            </div>
          </div>

          {/* Área de chat */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            {selectedConversation && currentConversation ? (
              <>
                {/* Header del chat */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      {currentConversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{currentConversation.patientName}</h3>
                      <p className="text-sm text-gray-600">
                        {currentConversation.isOnline ? 'En línea' : 'Desconectado'}
                        {isTyping && ' • escribiendo...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/patients/${currentConversation.patientId}`)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      title="Ver perfil del paciente"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderRole === 'doctor' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderRole === 'doctor'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-between mt-1 ${
                          message.senderRole === 'doctor' ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {message.senderRole === 'doctor' && (
                            <div className="ml-2">
                              {getMessageStatus(message.status)}
                            </div>
                          )}
                        </div>
                        
                        {message.isImportant && (
                          <div className="mt-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de mensaje */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Image className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Camera className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Escribe un mensaje..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una conversación</h3>
                  <p className="text-gray-600">Elige una conversación para comenzar a chatear</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
