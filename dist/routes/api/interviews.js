import {} from 'fastify';
import { ModelRouter } from "../../ai/Router.js";
import { rateLimit } from "../../lib/rateLimit.js";
import { NeonInterviewMessageRepository } from '../../db/NeonInterviewMessageRepository.js';
const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
function validateImage(image) {
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
    }
    catch {
        return { valid: false, error: 'Invalid base64 encoding' };
    }
    return { valid: true };
}
const interviewRoutes = async (server) => {
    const router = new ModelRouter();
    const messageRepository = new NeonInterviewMessageRepository();
    server.post("/", async (request, reply) => {
        const { input, locale, image } = request.body;
        const clientId = request.headers['x-client-id'];
        if (!clientId || !rateLimit(clientId)) {
            return reply.status(429).send({ error: 'Rate limit exceeded' });
        }
        // Validate image if provided
        let validatedImage;
        if (image) {
            const validation = validateImage(image);
            if (!validation.valid) {
                return reply.status(400).send({ error: validation.error });
            }
            validatedImage = image;
        }
        const provider = router.getProvider();
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
        const { interviewId } = request.params;
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
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Failed to load messages'
            });
        }
    });
};
export default interviewRoutes;
