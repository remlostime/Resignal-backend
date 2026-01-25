import fastify, { type FastifyInstance } from 'fastify';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const createServer = async (): Promise<FastifyInstance> => {
  const server = fastify({ logger: true });

  // 健康检查
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // 动态导入 chat 路由
  const chatModule = await import(join(__dirname, 'routes', 'api', 'chat.js'));
  await server.register(chatModule.default, { prefix: '/api/chat' });

  return server;
};

export default createServer;
