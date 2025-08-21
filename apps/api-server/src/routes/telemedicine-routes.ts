import { Router } from 'express';
import { UnifiedAuth } from '../auth/UnifiedAuthSystem';
import { UnifiedTelemedicineController, WebRTCServer } from '../telemedicine/unified-telemedicine-controller';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas de telemedicina
router.use(UnifiedAuth);

// Inicializar servidor WebRTC
const webrtcServer = new WebRTCServer();
const telemedicineController = new UnifiedTelemedicineController(webrtcServer);

// Iniciar servidor WebRTC en puerto separado
webrtcServer.start(3001);

// Rutas de sesiones de telemedicina
router.post('/sessions', (req, res) => telemedicineController.createSession(req, res));
router.get('/sessions/:sessionId', (req, res) => telemedicineController.getSession(req, res));
router.get('/sessions', (req, res) => telemedicineController.getSessionsByUser(req, res));
router.put('/sessions/:sessionId/start', (req, res) => telemedicineController.startSession(req, res));
router.put('/sessions/:sessionId/end', (req, res) => telemedicineController.endSession(req, res));
router.put('/sessions/:sessionId/cancel', (req, res) => telemedicineController.cancelSession(req, res));

// Rutas de chat
router.post('/sessions/:sessionId/chat', (req, res) => telemedicineController.addChatMessage(req, res));
router.get('/sessions/:sessionId/chat', (req, res) => telemedicineController.getChatHistory(req, res));

// Rutas de estadísticas
router.get('/stats', (req, res) => telemedicineController.getTelemedicineStats(req, res));

// Rutas de salas WebRTC
router.get('/rooms/:roomId/availability', (req, res) => telemedicineController.checkRoomAvailability(req, res));

// Ruta de estado del sistema
router.get('/system/status', (req, res) => telemedicineController.getSystemStatus(req, res));

// Limpiar sesiones antiguas cada día
setInterval(() => {
  telemedicineController.cleanupOldSessions();
}, 24 * 60 * 60 * 1000); // 24 horas

export default router; 