
# CLAUDE.md - App: Signaling Server
**Última actualización:** 27 de julio de 2025

## 1. Resumen de la Aplicación
- **Propósito:** Servidor de señalización para las sesiones de telemedicina (WebRTC).
- **Tecnologías Clave:** Node.js 22, WebSockets (`ws` library), TypeScript.
- **Responsabilidades:**
  - Gestión de salas de telemedicina.
  - Intercambio de mensajes de señalización (ofertas, respuestas, candidatos ICE) entre pares.

## 2. Contexto Técnico Específico
### Arquitectura
- **Servidor de WebSockets:** Un servidor ligero que gestiona las conexiones y los mensajes.
- **Lógica de Salas:** Mantiene un registro de las salas activas y los participantes en cada una.

### Seguridad
- **Autenticación:** Valida los tokens de los usuarios que intentan conectarse, asegurando que solo los usuarios autorizados puedan iniciar o unirse a una sesión.
- **No PHI:** El servidor de señalización **nunca** debe procesar o almacenar PHI. Su única función es facilitar la conexión P2P.

## 3. Reglas de Codificación (App-Specific)
- **Eficiencia:** El servidor debe ser ligero y eficiente para manejar un gran número de conexiones simultáneas.
- **Manejo de Errores:** Implementa una gestión de errores robusta para las desconexiones y los fallos en la negociación de la conexión.
