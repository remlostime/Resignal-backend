import { neon } from '@neondatabase/serverless';
import type { FastifyPluginAsync } from 'fastify';

const neonPlugin: FastifyPluginAsync = async (server) => {
  // 取连接串（本地用 .env.local，Vercel 自动注入）
  const sql = neon(process.env.DATABASE_URL!);

  server.get('/health', async () => {
    const [result] = await sql`SELECT now() as t;`;
    return { db: 'up', neonNow: result.t };
  });

    /* ---------- 新增：demo 插入 ---------- */
    server.post('/demo', async (request, reply) => {
        const { email } = request.body as { email: string };
    
        const [user] = await sql`
          INSERT INTO users(email) VALUES (${email})
          ON CONFLICT DO NOTHING
          RETURNING id, email;
        `;
    
        if (!user) {
          return reply.status(409).send({ message: 'already exists' });
        }
        return user;
      });
};

export default neonPlugin;