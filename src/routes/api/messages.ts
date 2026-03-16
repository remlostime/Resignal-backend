import { type FastifyPluginAsync } from 'fastify';
import { ModelRouter } from '../../ai/Router.js';

const messageRoutes: FastifyPluginAsync = async (server) => {
  const router = new ModelRouter();

  // POST /api/messages - Send a message and get AI reply
  server.post('/', async (request, reply) => {
    const { interview_id, message, user_id, model } = request.body as {
      interview_id: string;
      message: string;
      user_id: string;
      model?: string;
    };

    // Validate required fields
    if (!interview_id || !message || !user_id) {
      return reply.status(400).send({
        error: 'Missing required fields: interview_id, message, and user_id are required'
      });
    }

    try {
      const provider = router.getProvider(model);
      const result = await provider.chat({
        interviewId: interview_id,
        message,
        userId: user_id
      });

      return {
        success: true,
        reply: result.reply,
        messageId: result.messageId
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        error: 'Failed to process message'
      });
    }
  });
};

export default messageRoutes;
