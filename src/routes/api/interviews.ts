import { type FastifyPluginAsync } from 'fastify';
import { ModelRouter } from "../../ai/Router.js";
import { rateLimit } from "../../lib/rateLimit.js";
import { sendError } from "../../lib/errors.js";
import type { InterviewMessageRepository } from '../../db/InterviewMessageRepository.js';
import { NeonInterviewMessageRepository } from '../../db/NeonInterviewMessageRepository.js';
import type { InterviewRepository } from '../../db/InterviewRepository.js';
import { NeonInterviewRepository } from '../../db/NeonInterviewRepository.js';
import type { InterviewContextRepository } from '../../db/InterviewContextRepository.js';
import { NeonInterviewContextRepository } from '../../db/NeonInterviewContextRepository.js';
import type { UserRepository } from '../../db/UserRepository.js';
import { NeonUserRepository } from '../../db/NeonUserRepository.js';
import { buildAuthMiddleware } from '../../middleware/auth.js';
import type { ImageAttachment, FeedbackResponse } from '../../ai/AIProvider.js';

const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

function validateImage(image: { base64: string; mimeType: string }): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(image.mimeType)) {
    return { 
      valid: false, 
      error: `Invalid image type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}` 
    };
  }

  try {
    const buffer = Buffer.from(image.base64, 'base64');
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      return { 
        valid: false, 
        error: `Image size exceeds maximum allowed size of 3MB` 
      };
    }
  } catch {
    return { valid: false, error: 'Invalid base64 encoding' };
  }

  return { valid: true };
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const interviewRoutes: FastifyPluginAsync = async (server) => {
  const router = new ModelRouter();
  const messageRepository: InterviewMessageRepository = new NeonInterviewMessageRepository();
  const interviewRepository: InterviewRepository = new NeonInterviewRepository();
  const interviewContextRepository: InterviewContextRepository = new NeonInterviewContextRepository();
  const userRepository: UserRepository = new NeonUserRepository();
  const { authenticate } = buildAuthMiddleware(userRepository);

  server.get("/", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.authenticatedUser.id;

    if (!rateLimit(userId)) {
      return sendError(reply, 429, "RATE_LIMITED", "Rate limit exceeded");
    }

    const { page: pageParam, page_size: pageSizeParam } = request.query as {
      page?: string;
      page_size?: string;
    };

    const page = pageParam ? parseInt(pageParam, 10) : DEFAULT_PAGE;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : DEFAULT_PAGE_SIZE;

    if (isNaN(page) || page < 1) {
      return sendError(reply, 400, "INVALID_INPUT", "page must be a positive integer");
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      return sendError(reply, 400, "INVALID_INPUT", `page_size must be between 1 and ${MAX_PAGE_SIZE}`);
    }

    try {
      const result = await interviewRepository.getPaginatedInterviewsByUserId(userId, page, pageSize);
      const totalPages = Math.ceil(result.total / pageSize);

      return {
        interviews: result.items.map(item => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          created_at: item.createdAt.toISOString()
        })),
        pagination: {
          current_page: page,
          page_size: pageSize,
          total_pages: totalPages,
          total_items: result.total
        }
      };
    } catch (error) {
      server.log.error(error);
      return sendError(reply, 500, "INTERNAL_ERROR", "Failed to fetch interviews");
    }
  });

  server.get("/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.authenticatedUser.id;

    if (!rateLimit(userId)) {
      return sendError(reply, 429, "RATE_LIMITED", "Rate limit exceeded");
    }

    const { id } = request.params as { id: string };

    if (!id) {
      return sendError(reply, 400, "INVALID_INPUT", "Missing required parameter: id");
    }

    try {
      const context = await interviewContextRepository.getContextByInterviewId(id);

      if (!context) {
        return sendError(reply, 404, "NOT_FOUND", "Interview not found");
      }

      const feedback = context.contextJson as FeedbackResponse;

      return {
        id: context.interviewId,
        title: feedback.title,
        summary: feedback.summary,
        strengths: feedback.strengths,
        improvement: feedback.improvement,
        hiring_signal: feedback.hiring_signal,
        key_observations: feedback.key_observations
      };
    } catch (error) {
      server.log.error(error);
      return sendError(reply, 500, "INTERNAL_ERROR", "Failed to fetch interview details");
    }
  });

  server.get("/:id/transcript", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.authenticatedUser.id;

    if (!rateLimit(userId)) {
      return sendError(reply, 429, "RATE_LIMITED", "Rate limit exceeded");
    }

    const { id } = request.params as { id: string };

    if (!id) {
      return sendError(reply, 400, "INVALID_INPUT", "Missing required parameter: id");
    }

    try {
      const interview = await interviewRepository.getInterviewById(id);

      if (!interview) {
        return sendError(reply, 404, "NOT_FOUND", "Interview not found");
      }

      return {
        id: interview.id,
        transcript: interview.transcript
      };
    } catch (error) {
      server.log.error(error);
      return sendError(reply, 500, "INTERNAL_ERROR", "Failed to fetch interview transcript");
    }
  });

  server.post("/", { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.authenticatedUser.id;

    if (!rateLimit(userId)) {
      return sendError(reply, 429, "RATE_LIMITED", "Rate limit exceeded");
    }

    const { input, locale, image, model } = request.body as {
      input: string;
      locale: string;
      image?: { base64: string; mimeType: string };
      model?: string;
    };

    let validatedImage: ImageAttachment | undefined;
    if (image) {
      const validation = validateImage(image);
      if (!validation.valid) {
        return sendError(reply, 400, "INVALID_INPUT", validation.error!);
      }
      validatedImage = image;
    }

    const provider = router.getProvider(model);
    const result = await provider.interview({ 
      input, 
      locale, 
      userId,
      image: validatedImage
    });

    return {
      provider: provider.name,
      interview_id: result.interviewId,
      reply: result.output
    };
  });

  server.get("/:interviewId/messages", { preHandler: [authenticate] }, async (request, reply) => {
    const { interviewId } = request.params as { interviewId: string };

    if (!interviewId) {
      return sendError(reply, 400, "INVALID_INPUT", "Missing required parameter: interviewId");
    }

    try {
      const messages = await messageRepository.getMessagesByInterviewId(interviewId);
      
      return {
        success: true,
        messages
      };
    } catch (error) {
      server.log.error(error);
      return sendError(reply, 500, "INTERNAL_ERROR", "Failed to load messages");
    }
  });
};

export default interviewRoutes;
