import React, { useState } from 'react';
import DOMPurify from 'dompurify';

interface ChatMessage {
  id: number;
  sender: 'user' | 'other';
  text: string;
}

export function ChatComponent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'other', text: '¡Hola! ¿En qué puedo ayudarte hoy?' },
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (input.trim()) {
      // Sanitizar el input del usuario con DOMPurify
      const cleanInput = DOMPurify.sanitize(input);

      const newMessage: ChatMessage = {
        id: messages.length + 1,
        sender: 'user',
        text: cleanInput,
      };
      setMessages([...messages, newMessage]);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg shadow-md">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
              dangerouslySetInnerHTML={{ __html: msg.text }} // Usar dangerouslySetInnerHTML para mostrar HTML sanitizado
            />
          </div>
        ))}
      </div>
      <div className="border-t p-4 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          placeholder="Escribe tu mensaje..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
