import { type FastifyPluginAsync } from 'fastify';
import { ModelRouter } from "../../ai/Router";

const chatRoutes: FastifyPluginAsync = async (server) => {
  const router = new ModelRouter();

  server.post("/", async (request, reply) => {
    const { input, task, locale } = request.body as any;

    const provider = router.getProvider(task);
    const result = await provider.chat({ input, task, locale });

    return {
      provider: provider.name,
      reply: result.output
    };
  });
};

export default chatRoutes;