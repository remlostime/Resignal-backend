import { type FastifyPluginAsync } from 'fastify';
import { ModelRouter } from "../../ai/Router.js";
import { rateLimit } from "../../lib/rateLimit.js";
import type { InterviewMessageRepository } from '../../db/InterviewMessageRepository.js';
import { NeonInterviewMessageRepository } from '../../db/NeonInterviewMessageRepository.js';
import type { InterviewRepository } from '../../db/InterviewRepository.js';
import { NeonInterviewRepository } from '../../db/NeonInterviewRepository.js';
import type { ImageAttachment } from '../../ai/AIProvider.js';

const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

function validateImage(image: { base64: string; mimeType: string }): { valid: boolean; error?: string } {
  // Validate mime type
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(image.mimeType)) {
    return { 
      valid: false, 
      error: `Invalid image type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}` 
    };
  }

  // Validate size (decode base64 to check actual size)
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

  server.get("/", async (request, reply) => {
    const clientId = request.headers['x-client-id'] as string;

    if (!clientId) {
      return reply.status(401).send({ error: 'Missing x-client-id header' });
    }

    if (!rateLimit(clientId)) {
      return reply.status(429).send({ error: 'Rate limit exceeded' });
    }

    const { user_id, page: pageParam, page_size: pageSizeParam } = request.query as {
      user_id?: string;
      page?: string;
      page_size?: string;
    };

    if (!user_id) {
      return reply.status(400).send({ error: 'Missing required query parameter: user_id' });
    }

    const page = pageParam ? parseInt(pageParam, 10) : DEFAULT_PAGE;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : DEFAULT_PAGE_SIZE;

    if (isNaN(page) || page < 1) {
      return reply.status(400).send({ error: 'page must be a positive integer' });
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      return reply.status(400).send({ error: `page_size must be between 1 and ${MAX_PAGE_SIZE}` });
    }

    try {
      const result = await interviewRepository.getPaginatedInterviewsByUserId(user_id, page, pageSize);
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
      return reply.status(500).send({ error: 'Failed to fetch interviews' });
    }
  });

  server.post("/", async (request, reply) => {
    const { input, locale, image, model } = request.body as {
      input: string;
      locale: string;
      image?: { base64: string; mimeType: string };
      model?: string;
    };
    const clientId = request.headers['x-client-id'] as string;

    if (!clientId || !rateLimit(clientId)) {
      return reply.status(429).send({ error: 'Rate limit exceeded' });
    }

    // Validate image if provided
    let validatedImage: ImageAttachment | undefined;
    if (image) {
      const validation = validateImage(image);
      if (!validation.valid) {
        return reply.status(400).send({ error: validation.error });
      }
      validatedImage = image;
    }

    const provider = router.getProvider(model);
    const result = await provider.interview({ 
      input, 
      locale, 
      userId: clientId,
      image: validatedImage
    });

    return {
      provider: provider.name,
      interview_id: result.interviewId,
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
