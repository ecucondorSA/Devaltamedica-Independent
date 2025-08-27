"use client";

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Paperclip, Image, File, User, Clock } from "lucide-react";
import DOMPurify from "dompurify";

import { logger } from '@altamedica/shared/services/logger.service';
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: "text" | "file" | "image" | "system";
}

interface ChatPanelProps {
  sessionId: string;
  onSendMessage?: (message: string) => void;
}

export default function ChatPanel({
  sessionId,
  onSendMessage
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      senderId: "system",
      senderName: "Sistema",
      message: "Chat iniciado. Conectando al servidor...",
      timestamp: new Date(),
      type: "system"
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Conectar al servidor de chat
  useEffect(() => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      logger.info('💬 Doctor conectado al servidor de chat');
      setIsConnected(true);
      
      // Actualizar mensaje del sistema
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== "1"),
        {
          id: "1",
          senderId: "system",
          senderName: "Sistema",
          message: "Chat conectado. Esperando mensajes del paciente...",
          timestamp: new Date(),
          type: "system"
        }
      ]);
    });

    socket.on('disconnect', () => {
      logger.info('💬 Doctor desconectado del servidor de chat');
      setIsConnected(false);
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: "system",
          senderName: "Sistema",
          message: "Conexión perdida. Reconectando...",
          timestamp: new Date(),
          type: "system"
        }
      ]);
    });

    socket.on('chat-message', (data) => {
      logger.info('💬 Mensaje recibido:', data);
      
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: data.from || 'unknown',
        senderName: data.userType === 'patient' ? 'Paciente' : 'Dr. Martínez',
        message: DOMPurify.sanitize(data.message),
        timestamp: new Date(data.timestamp || Date.now()),
        type: "text"
      };
      
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current && isConnected) {
      const sanitizedMessage = DOMPurify.sanitize(newMessage.trim());
      // Enviar mensaje al servidor
      socketRef.current.emit('chat-message', {
        roomId: sessionId,
        message: sanitizedMessage
      });
      
      // Agregar mensaje local inmediatamente
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: "doctor",
        senderName: "Dr. Martínez",
        message: sanitizedMessage,
        timestamp: new Date(),
        type: "text"
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      
      if (onSendMessage) {
        onSendMessage(sanitizedMessage);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-96 bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Chat de Consulta</h3>
            <p className="text-blue-100 text-sm">Paciente - Consulta Virtual</p>
            <p className="text-blue-100 text-xs">Sesión: {sessionId}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === "doctor";
          const isSystemMessage = message.senderId === "system";

          if (isSystemMessage) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                  {message.message}
                </div>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {!isOwnMessage && (
                  <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {message.senderName}
                  </div>
                )}
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: message.message }}></div>
                <div
                  className={`text-xs mt-1 flex items-center ${
                    isOwnMessage ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 rounded-b-lg">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Image className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <File className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Escribe un mensaje..." : "Conectando..."}
              disabled={!isConnected}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={1}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 