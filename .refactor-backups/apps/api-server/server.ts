import express, { Request, Response } from 'express';
import next from 'next';
import http from 'http';
import { Server } from 'socket.io';
import { TelemedicineService } from './src/services/telemedicine.service';

import { logger } from '@altamedica/shared/services/logger.service';
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*', // En producción, debería ser más restrictivo
      methods: ['GET', 'POST'],
    },
  });

  // Inicializar el servicio de telemedicina con la instancia de socket.io
  TelemedicineService.initialize(io);

  // Dejar que Next.js maneje todas las demás rutas
  app.all('*', (req: Request, res: Response) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    logger.info(`> Servidor listo en http://localhost:${PORT}`);
  });
});
