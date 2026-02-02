import { type FastifyPluginAsync } from 'fastify';
import { ModelRouter } from "../../ai/Router.js";
import { rateLimit } from "../../lib/rateLimit.js";

const interviewRoutes: FastifyPluginAsync = async (server) => {
  const router = new ModelRouter();

  server.post("/", async (request, reply) => {
    const { input, task, locale } = request.body as any;
    const clientId = request.headers['x-client-id'] as string;

    if (!clientId || !rateLimit(clientId)) {
      return reply.status(429).send({ error: 'Rate limit exceeded' });
    }

    const provider = router.getProvider(task);
    const result = await provider.interview({ input, task, locale, userId: clientId });

    return {
      provider: provider.name,
      reply: result.output
    };
  });
};

export default interviewRoutes;
