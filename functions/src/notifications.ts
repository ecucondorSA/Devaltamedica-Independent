import { onRequest } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
initializeApp()

interface MedicalNotificationData {
  recipientId: string
  type: 'appointment_reminder' | 'lab_results' | 'emergency_alert' | 'message' | 'prescription'
  title: string
  body: string
  priority: 'normal' | 'high' | 'urgent'
  data?: { [key: string]: string }
  medicalMetadata?: {
    patientId?: string
    appointmentId?: string
    documentId?: string
    urgency?: 'low' | 'medium' | 'high' | 'urgent'
  }
}

// Send push notification to specific user
export const sendMedicalNotification = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      const { recipientId, type, title, body, priority, data, medicalMetadata }: MedicalNotificationData = request.body

      if (!recipientId || !type || !title || !body) {
        response.status(400).json({ 
          error: 'Missing required fields: recipientId, type, title, body' 
        })
        return
      }

      const db = getFirestore()
      const messaging = getMessaging()

      // Get user's FCM tokens
      const userDoc = await db.collection('users').doc(recipientId).get()
      if (!userDoc.exists) {
        response.status(404).json({ error: 'User not found' })
        return
      }

      const userData = userDoc.data()
      const fcmTokens = userData?.fcmTokens || []

      if (fcmTokens.length === 0) {
        response.status(400).json({ error: 'No FCM tokens found for user' })
        return
      }

      // Create notification payload
      const message = {
        notification: {
          title,
          body,
        },
        data: {
          type,
          priority,
          recipientId,
          ...(data || {}),
          ...(medicalMetadata ? {
            patientId: medicalMetadata.patientId || '',
            appointmentId: medicalMetadata.appointmentId || '',
            documentId: medicalMetadata.documentId || '',
            urgency: medicalMetadata.urgency || 'low'
          } : {})
        },
        android: {
          priority: priority === 'urgent' ? 'high' : 'normal',
          notification: {
            icon: 'ic_notification',
            sound: priority === 'urgent' ? 'emergency_alert' : 'default',
            channelId: type === 'emergency_alert' ? 'emergency' : 'medical'
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body
              },
              sound: priority === 'urgent' ? 'emergency_alert.aiff' : 'default',
              badge: 1,
              category: type
            }
          }
        },
        tokens: fcmTokens
      }

      // Send notification
      const result = await messaging.sendEachForMulticast(message)

      // Store notification in Firestore
      await db.collection('medical_notifications').add({
        recipientId,
        type,
        title,
        body,
        priority,
        data: data || {},
        medicalMetadata: medicalMetadata || {},
        read: false,
        createdAt: new Date(),
        sentAt: new Date(),
        deliveryStatus: {
          successCount: result.successCount,
          failureCount: result.failureCount,
          errors: result.responses
            .filter((resp, idx) => !resp.success)
            .map((resp, idx) => ({
              token: fcmTokens[idx],
              error: resp.error?.message
            }))
        }
      })

      response.json({
        success: true,
        deliveryReport: {
          successCount: result.successCount,
          failureCount: result.failureCount,
          totalTokens: fcmTokens.length
        }
      })

    } catch (error) {
      console.error('Error sending notification:', error)
      response.status(500).json({ 
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Send batch notifications (e.g., appointment reminders for the day)
export const sendBatchNotifications = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      const { notifications }: { notifications: MedicalNotificationData[] } = request.body

      if (!notifications || !Array.isArray(notifications)) {
        response.status(400).json({ error: 'Invalid notifications array' })
        return
      }

      const results = []
      
      for (const notification of notifications) {
        try {
          // Send individual notification
          const notificationResponse = await fetch(`${request.get('origin')}/sendMedicalNotification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(notification)
          })

          const result = await notificationResponse.json()
          results.push({
            recipientId: notification.recipientId,
            success: notificationResponse.ok,
            result
          })
        } catch (error) {
          results.push({
            recipientId: notification.recipientId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      response.json({
        success: true,
        batchResults: results,
        summary: {
          total: notifications.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      })

    } catch (error) {
      console.error('Error sending batch notifications:', error)
      response.status(500).json({ 
        error: 'Failed to send batch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Schedule appointment reminders
export const scheduleAppointmentReminders = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      const db = getFirestore()
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // Get appointments for tomorrow
      const appointmentsQuery = await db
        .collection('appointments')
        .where('appointmentDate', '>=', now)
        .where('appointmentDate', '<=', tomorrow)
        .where('status', '==', 'confirmed')
        .get()

      const notifications: MedicalNotificationData[] = []

      appointmentsQuery.docs.forEach(doc => {
        const appointment = doc.data()
        
        // Reminder for patient
        notifications.push({
          recipientId: appointment.patientId,
          type: 'appointment_reminder',
          title: 'Recordatorio de Cita Médica',
          body: `Su cita con ${appointment.doctorName} está programada para mañana a las ${appointment.time}`,
          priority: 'high',
          medicalMetadata: {
            appointmentId: doc.id,
            patientId: appointment.patientId,
            urgency: 'medium'
          }
        })

        // Reminder for doctor
        notifications.push({
          recipientId: appointment.doctorId,
          type: 'appointment_reminder',
          title: 'Recordatorio de Cita',
          body: `Cita con ${appointment.patientName} mañana a las ${appointment.time}`,
          priority: 'normal',
          medicalMetadata: {
            appointmentId: doc.id,
            patientId: appointment.patientId,
            urgency: 'low'
          }
        })
      })

      // Send batch notifications
      if (notifications.length > 0) {
        const batchResponse = await fetch(`${request.get('origin')}/sendBatchNotifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notifications })
        })

        const batchResult = await batchResponse.json()
        
        response.json({
          success: true,
          message: `Scheduled ${notifications.length} appointment reminders`,
          batchResult
        })
      } else {
        response.json({
          success: true,
          message: 'No appointments found for tomorrow',
          count: 0
        })
      }

    } catch (error) {
      console.error('Error scheduling reminders:', error)
      response.status(500).json({ 
        error: 'Failed to schedule appointment reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Handle FCM token registration/update
export const updateFCMToken = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      const { userId, token, device } = request.body

      if (!userId || !token) {
        response.status(400).json({ error: 'Missing userId or token' })
        return
      }

      const db = getFirestore()
      const userRef = db.collection('users').doc(userId)

      // Get current user data
      const userDoc = await userRef.get()
      const userData = userDoc.data() || {}
      const currentTokens = userData.fcmTokens || []

      // Add new token if not already present
      if (!currentTokens.includes(token)) {
        await userRef.update({
          fcmTokens: [...currentTokens, token],
          lastTokenUpdate: new Date(),
          deviceInfo: {
            ...userData.deviceInfo,
            [token]: {
              device: device || 'unknown',
              registeredAt: new Date(),
              lastSeen: new Date()
            }
          }
        })
      } else {
        // Update last seen for existing token
        await userRef.update({
          [`deviceInfo.${token}.lastSeen`]: new Date()
        })
      }

      response.json({ success: true, message: 'FCM token updated successfully' })

    } catch (error) {
      console.error('Error updating FCM token:', error)
      response.status(500).json({ 
        error: 'Failed to update FCM token',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)