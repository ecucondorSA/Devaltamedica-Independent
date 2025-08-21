/**
 * 💬 CHATBOT SERVICE - ALTAMEDICA
 * Servicio para gestionar la lógica del chatbot médico con IA.
 */
import { adminDb } from '@/lib/firebase-admin';
import { medicalAIService } from './medical-ai-service';
import { ServiceContext } from '@/lib/patterns/ServicePattern';

class ChatbotService {
  private sessionsCollection = 'chatbot_sessions';
  private alertsCollection = 'medical_alerts';

  /**
   * Procesa un nuevo mensaje en una sesión de chatbot.
   * @param data - Datos del mensaje y la sesión.
   * @param context - Contexto de autenticación del usuario.
   * @returns La respuesta del chatbot y el estado de la sesión.
   */
  async processMessage(data: any, context: ServiceContext) {
    const { message, sessionId: existingSessionId, patientId, doctorId, userType, context: messageContext, conversationHistory: clientHistory } = data;

    // 1. Determinar o crear el ID de la sesión
    const sessionId = existingSessionId || this.generateSessionId();

    // 2. Recuperar historial de conversación si no se proveyó
    let conversationHistory = clientHistory || [];
    if (!clientHistory && existingSessionId) {
      const sessionDoc = await adminDb.collection(this.sessionsCollection).doc(existingSessionId).get();
      if (sessionDoc.exists) {
        conversationHistory = sessionDoc.data()?.conversationHistory || [];
      }
    }

    // 3. Preparar contexto para el servicio de IA
    const aiContext = {
      patientId: patientId || context.userId,
      medicalHistory: messageContext?.medicalHistory || [],
      currentSymptoms: messageContext?.currentSymptoms || [],
      userType: userType,
      language: messageContext?.language || 'es',
    };

    // 4. Obtener respuesta del chatbot de IA
    const chatbotResponse = await medicalAIService.medicalChatbot(message, aiContext);

    // 5. Construir y actualizar el historial de la conversación
    const updatedHistory = this.updateConversationHistory(conversationHistory, message, chatbotResponse);

    // 6. Guardar la sesión actualizada en Firestore
    const sessionData = this.buildSessionData(sessionId, data, updatedHistory, chatbotResponse, context);
    await adminDb.collection(this.sessionsCollection).doc(sessionId).set(sessionData, { merge: true });

    // 7. Crear alerta si la urgencia es alta
    if (chatbotResponse.urgency === 'emergency' || chatbotResponse.urgency === 'high') {
      await this.createChatbotAlert(sessionData, chatbotResponse);
    }

    // 8. Formatear y devolver la respuesta final
    return this.formatSuccessResponse(sessionId, updatedHistory.length, chatbotResponse, messageContext?.language);
  }

  /**
   * Obtiene una sesión de chatbot por su ID.
   * @param sessionId - El ID de la sesión.
   * @param context - Contexto de autenticación del usuario.
   * @returns Los datos de la sesión.
   */
  async getSessionById(sessionId: string, context: ServiceContext) {
    const sessionDoc = await adminDb.collection(this.sessionsCollection).doc(sessionId).get();
    if (!sessionDoc.exists) {
      return null;
    }
    // TODO: Añadir validación de permisos (ej. el usuario solo puede ver sus propias sesiones)
    return { id: sessionDoc.id, ...sessionDoc.data() };
  }

  /**
   * Elimina una sesión de chatbot.
   * @param sessionId - El ID de la sesión a eliminar.
   * @param context - Contexto de autenticación del usuario.
   * @returns Un booleano indicando si la operación fue exitosa.
   */
  async deleteSession(sessionId: string, context: ServiceContext) {
    // TODO: Añadir validación de permisos
    await adminDb.collection(this.sessionsCollection).doc(sessionId).delete();
    return true;
  }

  // --- Métodos privados de ayuda ---

  private generateSessionId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateConversationHistory(history: any[], userMessage: string, botResponse: any): any[] {
    const userEntry = { role: 'user' as const, message: userMessage, timestamp: new Date().toISOString() };
    const assistantEntry = {
      role: 'assistant' as const,
      message: botResponse.response,
      timestamp: new Date().toISOString(),
      confidence: botResponse.confidence,
      sources: botResponse.sources,
      urgency: botResponse.urgency,
    };
    return [...history, userEntry, assistantEntry];
  }

  private buildSessionData(sessionId: string, originalData: any, history: any[], botResponse: any, context: ServiceContext): any {
    return {
      sessionId,
      patientId: originalData.patientId || context.userId,
      doctorId: originalData.doctorId,
      userType: originalData.userType,
      conversationHistory: history,
      lastActivity: new Date().toISOString(),
      messageCount: history.length,
      urgency: botResponse.urgency,
      status: 'active',
      createdBy: context.userId,
      metadata: {
        language: originalData.context?.language || 'es',
        confidence: botResponse.confidence,
        sourcesCount: botResponse.sources.length,
        followUpQuestionsCount: botResponse.followUpQuestions.length,
      },
    };
  }

  private async createChatbotAlert(sessionData: any, chatbotResponse: any) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'chatbot_alert',
      severity: chatbotResponse.urgency === 'emergency' ? 'critical' : 'high',
      patientId: sessionData.patientId,
      doctorId: sessionData.doctorId,
      sessionId: sessionData.sessionId,
      message: `Alerta de chatbot: Urgencia de nivel "${chatbotResponse.urgency}" detectada.`,
      details: {
        userMessage: sessionData.conversationHistory[sessionData.conversationHistory.length - 2]?.message,
        botResponse: chatbotResponse.response,
        urgency: chatbotResponse.urgency,
      },
      timestamp: new Date().toISOString(),
      status: 'active',
      requiresImmediateAction: chatbotResponse.urgency === 'emergency',
    };
    await adminDb.collection(this.alertsCollection).add(alert);
    // Aquí se podría conectar con un servicio de notificaciones
  }

  private formatSuccessResponse(sessionId: string, messageCount: number, botResponse: any, language: string = 'es') {
    return {
      sessionId,
      response: botResponse.response,
      confidence: botResponse.confidence,
      sources: botResponse.sources,
      followUpQuestions: botResponse.followUpQuestions,
      urgency: botResponse.urgency,
      metadata: {
        processingTime: 'N/A', // Este valor debería calcularse
        model: 'gpt-4-turbo', // O el modelo que se esté usando
        language,
        messageCount,
      },
      disclaimer: 'Este chatbot es asistido por IA. Para emergencias médicas, contacte inmediatamente a servicios de emergencia. Para diagnóstico y tratamiento, consulte con un profesional médico.',
    };
  }
}

export const chatbotService = new ChatbotService();
