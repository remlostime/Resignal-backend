import { type FastifyPluginAsync } from 'fastify';
import { ModelRouter } from '../../ai/Router.js';
import type { UserRepository } from '../../db/UserRepository.js';
import { NeonUserRepository } from '../../db/NeonUserRepository.js';
import { buildAuthMiddleware } from '../../middleware/auth.js';
import { sendError } from '../../lib/errors.js';

const messageRoutes: FastifyPluginAsync = async (server) => {
  const router = new ModelRouter();
  const userRepository: UserRepository = new NeonUserRepository();
  const { authenticate } = buildAuthMiddleware(userRepository);

  server.post('/', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['interview_id', 'message'],
        properties: {
          interview_id: { type: 'string' },
          message: { type: 'string' },
          model: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const userId = request.authenticatedUser.id;
    const { interview_id, message, model } = request.body as {
      interview_id: string;
      message: string;
      model?: string;
    };

    try {
      const provider = router.getProvider(model);
      const result = await provider.chat({
        interviewId: interview_id,
        message,
        userId,
      });

      return {
        success: true,
        reply: result.reply,
        messageId: result.messageId
      };
    } catch (error) {
      server.log.error(error);
      return sendError(reply, 500, "INTERNAL_ERROR", "Failed to process message");
    }
  });
};

export default messageRoutes;
