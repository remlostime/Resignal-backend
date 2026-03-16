import fastify from 'fastify';
import multipart from '@fastify/multipart';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import jwtPlugin from './plugins/jwt.js';
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

await app.register(jwtPlugin);

const registerRoutes = async () => {
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  const authModule = await import(join(__dirname, 'routes', 'api', 'auth.js'));
  await app.register(authModule.default, { prefix: '/api/auth' });

  const billingModule = await import(join(__dirname, 'routes', 'api', 'billing.js'));
  await app.register(billingModule.default, { prefix: '/api/billing' });

  const interviewModule = await import(join(__dirname, 'routes', 'api', 'interviews.js'));
  await app.register(interviewModule.default, { prefix: '/api/interviews' });

  const messagesModule = await import(join(__dirname, 'routes', 'api', 'messages.js'));
  await app.register(messagesModule.default, { prefix: '/api/messages' });

  const transcriptionsModule = await import(join(__dirname, 'routes', 'api', 'transcriptions.js'));
  await app.register(transcriptionsModule.default, { prefix: '/api/transcriptions' });

  const processChunkModule = await import(join(__dirname, 'routes', 'api', 'internal', 'processTranscriptionChunk.js'));
  await app.register(processChunkModule.default, { prefix: '/api/internal' });
  
  await app.register(neonPlugin, { prefix: '/db' });

  const legalModule = await import(join(__dirname, 'routes', 'legal.js'));
  await app.register(legalModule.default);
};

await registerRoutes();

export { app };

export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};

console.log(app.printRoutes());
