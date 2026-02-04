import fastify from 'fastify';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import neonPlugin from './plugins/neon.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 创建 Fastify 实例
const app = fastify({ 
  logger: true,
  bodyLimit: 5 * 1024 * 1024  // 5MB limit to accommodate 3MB images + base64 overhead
});

// 注册路由
const registerRoutes = async () => {
  // 健康检查
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Interview 路由
  const interviewModule = await import(join(__dirname, 'routes', 'api', 'interviews.js'));
  await app.register(interviewModule.default, { prefix: '/api/interviews' });
  
  // User 路由
  const usersModule = await import(join(__dirname, 'routes', 'api', 'users.js'));
  await app.register(usersModule.default, { prefix: '/api/users' });
  
  // Message 路由
  const messagesModule = await import(join(__dirname, 'routes', 'api', 'messages.js'));
  await app.register(messagesModule.default, { prefix: '/api/messages' });
  
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