// mcp-server.js
// Módulo: CJS (CommonJS)
// Documentación: https://www.modelcontextprotocol.org/

import { logger } from '@altamedica/shared/services/logger.service';

const { createMcpServer } = require('@modelcontextprotocol/sdk');

const server = createMcpServer({
    port: 4000, // Cambia el puerto si tienes más servidores MCP
    resources: [
        {
            id: 'hello',
            type: 'text',
            getContent: async () => '¡Servidor MCP de Doctors activo!',
        },
    ],
    tools: [],
});

server.start();
logger.info('Servidor MCP (Doctors) corriendo en el puerto 4000'); 