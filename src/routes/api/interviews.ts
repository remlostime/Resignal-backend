import { type FastifyPluginAsync } from 'fastify';
import { ModelRouter } from "../../ai/Router.js";
import { rateLimit } from "../../lib/rateLimit.js";
import type { InterviewMessageRepository } from '../../db/InterviewMessageRepository.js';
import { NeonInterviewMessageRepository } from '../../db/NeonInterviewMessageRepository.js';

const interviewRoutes: FastifyPluginAsync = async (server) => {
  const router = new ModelRouter();
  const messageRepository: InterviewMessageRepository = new NeonInterviewMessageRepository();

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

  // GET /:interviewId/messages - Load messages for a specific interview
  server.get("/:interviewId/messages", async (request, reply) => {
    const { interviewId } = request.params as { interviewId: string };

    if (!interviewId) {
      return reply.status(400).send({
        error: 'Missing required parameter: interviewId'
      });
    }

    try {
      const messages = await messageRepository.getMessagesByInterviewId(interviewId);
      
      return {
        success: true,
        messages
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        error: 'Failed to load messages'
      });
    }
  });
};

export default interviewRoutes;
