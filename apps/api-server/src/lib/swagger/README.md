# 📚 AltaMedica API Documentation

## 🚀 Acceso a la Documentación

### Desarrollo Local
Accede a la documentación interactiva en: http://localhost:3001/api/swagger

### Producción
La documentación en producción requiere autenticación: https://api.altamedica.com/api/swagger

## 📋 Añadir Documentación a Nuevos Endpoints

### 1. Documentación Inline con JSDoc

Para documentar automáticamente tus endpoints, usa comentarios JSDoc en tus rutas:

```typescript
/**
 * @swagger
 * /api/v1/patients/{id}/medical-history:
 *   get:
 *     tags: [Medical Records]
 *     summary: Get patient medical history
 *     description: Returns complete medical history for a patient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Medical history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MedicalRecord'
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Implementación...
}
```

### 2. Esquemas Compartidos

Define esquemas reutilizables en `swagger-config.ts`:

```typescript
export const swaggerDefinition = {
  components: {
    schemas: {
      Prescription: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          medications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                dosage: { type: 'string' },
                frequency: { type: 'string' }
              }
            }
          },
          validUntil: { type: 'string', format: 'date' }
        }
      }
    }
  }
};
```

### 3. Documentación Manual en spec/route.ts

Para endpoints complejos, agrega la documentación directamente en `generatePaths()`:

```typescript
function generatePaths() {
  return {
    '/telemedicine/sessions/{id}/recordings': {
      get: {
        tags: ['Telemedicine'],
        summary: 'Get session recordings',
        description: 'Returns video recordings for a telemedicine session',
        operationId: 'getSessionRecordings',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Recordings retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recordings: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          url: { type: 'string' },
                          duration: { type: 'integer' },
                          size: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
}
```

## 🛡️ Seguridad en la Documentación

### Desarrollo
- Acceso abierto para facilitar el desarrollo
- Todos los endpoints disponibles

### Producción
- Requiere autenticación Bearer token
- Solo muestra endpoints según el rol del usuario
- Oculta endpoints internos y administrativos

## 🎨 Personalización

### Tema y Estilos
Modifica los estilos en `route.ts`:

```css
.swagger-ui .topbar {
  background-color: #1a73e8; /* Color corporativo */
}
```

### Configuración de Swagger UI
Ajusta opciones en `getSwaggerHTML()`:

```javascript
window.ui = SwaggerUIBundle({
  docExpansion: "list", // "none", "list", "full"
  filter: true, // Habilitar búsqueda
  tryItOutEnabled: true, // Permitir pruebas
  supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch']
});
```

## 📊 Mejores Prácticas

1. **Consistencia**: Usa los mismos nombres y estructuras en toda la API
2. **Ejemplos**: Incluye ejemplos realistas en los esquemas
3. **Descripciones**: Explica claramente qué hace cada endpoint
4. **Errores**: Documenta todos los posibles códigos de error
5. **Versionado**: Mantén la documentación sincronizada con el código

## 🔧 Herramientas Útiles

- **Swagger Editor**: https://editor.swagger.io/ para validar tu spec
- **OpenAPI Generator**: Para generar SDKs cliente automáticamente
- **Postman**: Importa la spec desde `/api/swagger/spec`

## 📝 Ejemplo Completo

```typescript
/**
 * @swagger
 * /api/v1/ai/diagnose:
 *   post:
 *     tags: [AI]
 *     summary: AI-powered diagnosis
 *     description: Analyzes symptoms and provides preliminary diagnosis
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symptoms, patientId]
 *             properties:
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["headache", "fever", "fatigue"]
 *               patientId:
 *                 type: string
 *                 example: "patient123"
 *               urgency:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *     responses:
 *       200:
 *         description: Diagnosis completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     possibleConditions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           condition:
 *                             type: string
 *                             example: "Common Cold"
 *                           probability:
 *                             type: number
 *                             example: 0.75
 *                           severity:
 *                             type: string
 *                             enum: [mild, moderate, severe]
 *                     recommendedActions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Rest", "Stay hydrated", "Monitor temperature"]
 *                     requiresUrgentCare:
 *                       type: boolean
 *                       example: false
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
```