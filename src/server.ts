import fastify from 'fastify';
import multipart from '@fastify/multipart';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import neonPlugin from './plugins/neon.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = fastify({ 
  logger: true,
  bodyLimit: 5 * 1024 * 1024
});

await app.register(multipart, {
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB — OpenAI Whisper per-file limit
  },
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

  // Transcription 路由
  const transcriptionsModule = await import(join(__dirname, 'routes', 'api', 'transcriptions.js'));
  await app.register(transcriptionsModule.default, { prefix: '/api/transcriptions' });

  // Internal webhook 路由 (QStash)
  const processChunkModule = await import(join(__dirname, 'routes', 'api', 'internal', 'processTranscriptionChunk.js'));
  await app.register(processChunkModule.default, { prefix: '/api/internal' });
  
  await app.register(neonPlugin, { prefix: '/db' });

  // Legal pages (public HTML)
  const legalModule = await import(join(__dirname, 'routes', 'legal.js'));
  await app.register(legalModule.default);
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