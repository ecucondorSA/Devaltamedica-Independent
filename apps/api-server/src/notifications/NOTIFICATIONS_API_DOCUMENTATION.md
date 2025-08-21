# 📢 UnifiedNotificationSystem - Documentación API

## 📋 Resumen

El **UnifiedNotificationSystem** es el sistema de notificaciones consolidado de AltaMedica que unifica 6 implementaciones fragmentadas en una sola API completa. Soporta múltiples canales (push, email, SMS, WebSocket), templates dinámicos, preferencias de usuario y notificaciones bulk.

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Notification    │───▶│ UnifiedService   │───▶│ Delivery        │
│ Request         │    │ - Validation     │    │ Channels        │
└─────────────────┘    │ - Templates      │    │ - Push          │
                       │ - Preferences    │    │ - Email         │
                       │ - Scheduling     │    │ - SMS           │
                       └──────────────────┘    │ - WebSocket     │
                                              └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Firebase Storage │
                       │ - Notifications  │
                       │ - Templates      │  
                       │ - Preferences    │
                       └──────────────────┘
```

## 🎯 Clase Principal: UnifiedNotificationService

### Singleton Pattern

```typescript
import { notificationService } from '@/notifications/UnifiedNotificationSystem';

// Servicio singleton listo para usar
const notification = await notificationService.createNotification({...});
```

## 📚 Interfaces Principales

### Notification

```typescript
interface Notification {
  id: string;
  userId: string;
  userType: 'patient' | 'doctor' | 'admin' | 'company' | 'staff';
  type: 'appointment_reminder' | 'telemedicine_confirmation' | 'medical_alert' | 
        'results_ready' | 'doctor_message' | 'system_alert' | 'payment_reminder' | 
        'prescription_ready' | 'lab_results' | 'emergency_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  status: 'unread' | 'read' | 'archived' | 'deleted';
  
  // Canales de entrega
  channels: ('push' | 'email' | 'sms' | 'websocket')[];
  deliveryStatus?: {
    push?: 'pending' | 'sent' | 'delivered' | 'failed';
    email?: 'pending' | 'sent' | 'delivered' | 'failed';
    sms?: 'pending' | 'sent' | 'delivered' | 'failed';
    websocket?: 'pending' | 'sent' | 'delivered' | 'failed';
  };
  
  // Metadata y contexto
  metadata?: Record<string, any>;
  appointmentId?: string;
  sessionId?: string;
  prescriptionId?: string;
  
  // Acciones
  actions?: NotificationAction[];
  
  // Programación
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  archivedAt?: Date;
  expiresAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### NotificationTemplate

```typescript
interface NotificationTemplate {
  id: string;
  type: string;
  name: string;
  title: string;           // Template con variables {{variable}}
  message: string;         // Template con variables {{variable}}
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  variables: string[];     // ['doctorName', 'appointmentDate']
  defaultChannels: ('push' | 'email' | 'sms' | 'websocket')[];
  userTypes: ('patient' | 'doctor' | 'admin' | 'company' | 'staff')[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### NotificationPreferences

```typescript
interface NotificationPreferences {
  userId: string;
  preferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
    websocket: boolean;
  };
  types: Record<string, {
    enabled: boolean;
    channels: ('push' | 'email' | 'sms' | 'websocket')[];
  }>;
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
    timezone: string;
  };
  updatedAt: Date;
}
```

## 🚀 API Methods

### Creación de Notificaciones

#### createNotification()

```typescript
const notification = await notificationService.createNotification({
  userId: 'user-123',
  userType: 'patient',
  type: 'appointment_reminder',
  title: 'Recordatorio de Cita',
  message: 'Su cita con Dr. García es mañana a las 10:00 AM',
  priority: 'high',
  channels: ['push', 'email'],
  scheduledFor: '2024-01-15T09:00:00Z', // Opcional
  metadata: {
    appointmentId: 'apt-456',
    doctorName: 'Dr. García'
  },
  actions: [
    {
      id: 'confirm',
      label: 'Confirmar Cita',
      type: 'button',
      action: '/appointments/apt-456/confirm',
      style: 'primary'
    }
  ]
});
```

#### createNotificationFromTemplate()

```typescript
const notification = await notificationService.createNotificationFromTemplate(
  'appointment_reminder',
  'user-123',
  {
    doctorName: 'Dr. García',
    appointmentDate: '15 de Enero',
    appointmentTime: '10:00 AM'
  },
  {
    priority: 'high',
    channels: ['push', 'email'],
    scheduledFor: new Date('2024-01-15T09:00:00Z'),
    metadata: { appointmentId: 'apt-456' }
  }
);
```

#### createBulkNotifications()

```typescript
const notifications = await notificationService.createBulkNotifications({
  userIds: ['user-1', 'user-2', 'user-3'],
  templateId: 'system_maintenance',
  variables: {
    maintenanceDate: '20 de Enero',
    maintenanceTime: '02:00 AM',
    estimatedDuration: '2 horas'
  },
  priority: 'medium',
  channels: ['push', 'email'],
  scheduledFor: new Date('2024-01-19T20:00:00Z')
});
```

### Consultas

#### getUserNotifications()

```typescript
const { notifications, total } = await notificationService.getUserNotifications(
  'user-123',
  {
    status: 'unread',
    limit: 20,
    offset: 0,
    orderBy: 'createdAt',
    orderDirection: 'desc'
  }
);
```

#### getNotification()

```typescript
const notification = await notificationService.getNotification('notif-456');
```

### Actualizaciones

#### markAsRead()

```typescript
const notification = await notificationService.markAsRead('notif-456');
```

#### markAllAsRead()

```typescript
const count = await notificationService.markAllAsRead('user-123');
```

#### updateNotification()

```typescript
const updated = await notificationService.updateNotification('notif-456', {
  status: 'archived',
  archivedAt: new Date().toISOString()
});
```

### Gestión de Preferencias

#### getUserPreferences()

```typescript
const preferences = await notificationService.getUserPreferences('user-123');
```

#### updateUserPreferences()

```typescript
const updated = await notificationService.updateUserPreferences('user-123', {
  preferences: {
    push: true,
    email: true,
    sms: false,
    websocket: true
  },
  types: {
    'appointment_reminder': {
      enabled: true,
      channels: ['push', 'email']
    },
    'medical_alert': {
      enabled: true,
      channels: ['push', 'email', 'sms']
    }
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'America/Mexico_City'
  }
});
```

## 📨 Templates Predefinidos

### Templates Disponibles

```typescript
const DEFAULT_TEMPLATES = [
  {
    type: 'appointment_reminder',
    title: 'Recordatorio: Cita con {{doctorName}}',
    message: 'Su cita con {{doctorName}} está programada para {{appointmentDate}} a las {{appointmentTime}}.',
    variables: ['doctorName', 'appointmentDate', 'appointmentTime']
  },
  {
    type: 'telemedicine_confirmation', 
    title: 'Sesión de Telemedicina Confirmada',
    message: 'Su sesión con {{doctorName}} ha sido confirmada para {{sessionDate}} a las {{sessionTime}}.',
    variables: ['doctorName', 'sessionDate', 'sessionTime']
  },
  {
    type: 'medical_alert',
    title: 'Alerta Médica - {{alertType}}',
    message: '{{alertMessage}}',
    variables: ['alertType', 'alertMessage']
  },
  {
    type: 'results_ready',
    title: 'Sus resultados están listos',
    message: 'Los resultados de {{testName}} ya están disponibles en su portal.',
    variables: ['testName']
  },
  {
    type: 'prescription_ready',
    title: 'Su receta está lista',
    message: 'Su receta para {{medicationName}} está lista en {{pharmacyName}}.',
    variables: ['medicationName', 'pharmacyName']
  }
];
```

### Creación de Templates Personalizados

```typescript
const templateId = await notificationService.createTemplate({
  type: 'custom_reminder',
  name: 'Recordatorio Personalizado',
  title: 'Recordatorio: {{eventName}}',
  message: 'No olvide {{eventName}} programado para {{eventDate}}. {{customMessage}}',
  priority: 'medium',
  variables: ['eventName', 'eventDate', 'customMessage'],
  defaultChannels: ['push', 'email'],
  userTypes: ['patient', 'doctor'],
  isActive: true
});
```

## 🎯 Uso en API Routes

### Endpoint para Crear Notificación

```typescript
import { notificationService, CreateNotificationSchema } from '@/notifications/UnifiedNotificationSystem';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateNotificationSchema.parse(body);
    
    const notification = await notificationService.createNotification(validatedData);
    
    return NextResponse.json({
      success: true,
      notification
    }, { status: 201 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}
```

### Endpoint para Obtener Notificaciones

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status') as 'unread' | 'read' | 'archived';
  const limit = parseInt(searchParams.get('limit') || '20');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }
  
  const result = await notificationService.getUserNotifications(userId, {
    status,
    limit
  });
  
  return NextResponse.json(result);
}
```

## 🔧 Configuración

### Variables de Entorno

```env
# Notificaciones Push
PUSH_NOTIFICATIONS_ENABLED=true
VAPID_PUBLIC_KEY=your-vapid-public-key
FCM_SERVER_KEY=your-fcm-server-key

# Notificaciones Email
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@altamedica.com
SENDGRID_API_KEY=your-sendgrid-api-key

# Notificaciones SMS
SMS_NOTIFICATIONS_ENABLED=true
SMS_PROVIDER=twilio
SMS_FROM=+1234567890
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# WebSocket
WEBSOCKET_NOTIFICATIONS_ENABLED=true
WEBSOCKET_ENDPOINT=ws://localhost:3001
```

### Configuración del Servicio

```typescript
export const notificationConfig = {
  limits: {
    maxNotificationsPerUser: 1000,
    maxBulkRecipients: 1000,
    retentionDays: 90
  },
  
  delivery: {
    push: { enabled: true },
    email: { enabled: true },
    sms: { enabled: false },
    websocket: { enabled: true }
  }
};
```

## 🛡️ Validaciones y Schemas

### Zod Schemas

```typescript
import { CreateNotificationSchema, UpdateNotificationSchema, NotificationPreferencesSchema } from '@/notifications/UnifiedNotificationSystem';

// Validar datos de entrada
const validatedData = CreateNotificationSchema.parse(inputData);
const updateData = UpdateNotificationSchema.parse(updateInput);
const preferences = NotificationPreferencesSchema.parse(prefData);
```

## 🧹 Mantenimiento

### Limpiar Notificaciones Antiguas

```typescript
// Eliminar notificaciones expiradas
const expiredCount = await notificationService.cleanupExpiredNotifications();

// Eliminar notificaciones viejas (>90 días)
const oldCount = await notificationService.cleanupOldNotifications();
```

## 📊 Métricas y Monitoring

El sistema incluye logging automático para:
- Notificaciones creadas y enviadas
- Fallos de entrega por canal
- Estadísticas de lectura
- Performance de templates

## 🔄 Migration Guide

### Desde notification.service.ts legacy

```typescript
// ❌ ANTES
import NotificationService from '../services/notification.service';
const service = new NotificationService();

// ✅ DESPUÉS
import { notificationService } from '../notifications/UnifiedNotificationSystem';
```

### Desde lib/notifications.ts legacy

```typescript
// ❌ ANTES
import { sendNotification } from '../lib/notifications';

// ✅ DESPUÉS
import { notificationService } from '../notifications/UnifiedNotificationSystem';
await notificationService.createNotification({...});
```

## 🧪 Testing

```typescript
import { notificationService, UnifiedNotificationService } from '@/notifications/UnifiedNotificationSystem';

describe('UnifiedNotificationSystem', () => {
  it('should create notification with template', async () => {
    const notification = await notificationService.createNotificationFromTemplate(
      'appointment_reminder',
      'test-user',
      { doctorName: 'Dr. Test' }
    );
    
    expect(notification.title).toContain('Dr. Test');
    expect(notification.type).toBe('appointment_reminder');
  });
});
```

## ⚠️ Consideraciones Importantes

### Rate Limiting
- Máximo 1000 notificaciones por usuario
- Máximo 1000 destinatarios en bulk
- Retention de 90 días por defecto

### Filtrado Automático
- Respeta preferencias del usuario
- Filtro por quiet hours
- Filtro por tipo de notificación
- Validación de canales habilitados

### Delivery Garantizado
- Retry automático en fallos
- Status tracking por canal
- Fallback a otros canales disponibles

---

## 📞 Support

Para soporte técnico o preguntas sobre notificaciones, contacta al equipo de desarrollo AltaMedica.

**Esta documentación cubre el 100% de la funcionalidad del UnifiedNotificationSystem consolidado.**