import fastify, { type FastifyInstance } from 'fastify';

const createServer = (): FastifyInstance => {
  const server = fastify({
    logger: true, // 开发环境日志
  });

  // 注册路由
  server.register(import('./routes/api/chat'), { prefix: '/api/chat' });

  // 健康检查
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return server;
};

export default createServer;
