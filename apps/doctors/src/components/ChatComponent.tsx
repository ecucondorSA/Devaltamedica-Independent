
import React, { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
}

export const ChatComponent = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() === '') return;

    const sanitizedMessage = DOMPurify.sanitize(newMessage);

    setMessages([
      ...messages,
      { id: Date.now().toString(), text: sanitizedMessage, sender: 'me' },
    ]);
    setNewMessage('');
  }, [newMessage, messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              textAlign: msg.sender === 'me' ? 'right' : 'left',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                backgroundColor: msg.sender === 'me' ? '#dcf8c6' : '#fff',
                padding: '5px 10px',
                borderRadius: '7px',
              }}
              dangerouslySetInnerHTML={{ __html: msg.text }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', padding: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flex: 1, marginRight: '10px' }}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};
