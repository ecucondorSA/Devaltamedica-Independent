// Stub de firebase-chat para web-app marketing (lógica de chat clínico extraída)
// Exporta interfaces mínimas y funciones no operativas.

export interface ChatConversation {
  id: string
  participants: string[]
  lastMessage?: string
  updatedAt?: any
  priority?: string
  unreadCount?: number
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName?: string
  senderRole?: string
  content: string
  createdAt?: any
  messageType?: string
  prescriptionData?: any
  attachments?: any[]
  status?: 'sent' | 'delivered' | 'read'
}

// Implementación mínima no operativa
export const firebaseChat = {
  subscribeToConversations: (_userId: string, cb: (c: ChatConversation[]) => void) => {
    cb([])
    return () => {}
  },
  subscribeToMessages: (_conversationId: string, cb: (m: ChatMessage[]) => void) => {
    cb([])
    return () => {}
  },
  sendMessage: async () => { /* noop */ },
  sendPrescription: async () => { /* noop */ },
  markMessagesAsRead: async () => { /* noop */ }
}
