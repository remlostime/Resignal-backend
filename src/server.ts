import fastify from 'fastify';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import neonPlugin from './plugins/neon.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 创建 Fastify 实例
const app = fastify({ logger: true });

// 注册路由
const registerRoutes = async () => {
  // 健康检查
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Chat 路由
  const chatModule = await import(join(__dirname, 'routes', 'api', 'chat.js'));
  await app.register(chatModule.default, { prefix: '/api/chat' });
  await app.register(neonPlugin, { prefix: '/db' });
};

// 立即注册路由
await registerRoutes();

// 导出 app 供本地开发使用
export { app };

// Vercel Serverless 入口（生产环境）
export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};

console.log(app.printRoutes());