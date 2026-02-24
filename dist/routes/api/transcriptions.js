import {} from "fastify";
import { rateLimit } from "../../lib/rateLimit.js";
import { sendError } from "../../lib/errors.js";
import { TranscriptionService, ServiceError } from "../../services/TranscriptionService.js";
import { NeonTranscriptionJobRepository } from "../../db/NeonTranscriptionJobRepository.js";
import { NeonUserRepository } from "../../db/NeonUserRepository.js";
import { buildAuthMiddleware } from "../../middleware/auth.js";
const transcriptionRoutes = async (server) => {
    const repository = new NeonTranscriptionJobRepository();
    const service = new TranscriptionService(repository);
    const userRepository = new NeonUserRepository();
    const { authenticate } = buildAuthMiddleware(userRepository);
    server.post("/", { preHandler: [authenticate] }, async (request, reply) => {
        const userId = request.authenticatedUser.id;
        if (!rateLimit(userId)) {
            return sendError(reply, 429, "RATE_LIMITED", "Rate limit exceeded");
        }
        const { totalChunks } = request.body;
        if (!totalChunks || typeof totalChunks !== "number") {
            return sendError(reply, 400, "INVALID_INPUT", "totalChunks is required and must be a number");
        }
        try {
            const job = await service.createJob(userId, totalChunks);
            return { success: true, jobId: job.id, status: job.status };
        }
        catch (error) {
            return handleServiceError(error, reply);
        }
    });
    server.post("/:jobId/chunks", { preHandler: [authenticate] }, async (request, reply) => {
        const userId = request.authenticatedUser.id;
        const { jobId } = request.params;
        const data = await request.file();
        if (!data) {
            return sendError(reply, 400, "INVALID_INPUT", "No file uploaded. Use field name 'audio'.");
        }
        const chunkIndexField = data.fields["chunkIndex"];
        if (!chunkIndexField || !("value" in chunkIndexField)) {
            return sendError(reply, 400, "INVALID_INPUT", "Missing chunkIndex field");
        }
        const chunkIndex = parseInt(chunkIndexField.value, 10);
        if (Number.isNaN(chunkIndex)) {
            return sendError(reply, 400, "INVALID_INPUT", "chunkIndex must be a number");
        }
        try {
            const audioBuffer = await data.toBuffer();
            const result = await service.uploadChunk(jobId, userId, chunkIndex, audioBuffer, data.filename, data.mimetype);
            return {
                success: true,
                chunksUploaded: result.chunksUploaded,
                totalChunks: result.totalChunks,
            };
        }
        catch (error) {
            return handleServiceError(error, reply);
        }
    });
    server.get("/:jobId", { preHandler: [authenticate] }, async (request, reply) => {
        const userId = request.authenticatedUser.id;
        const { jobId } = request.params;
        try {
            const job = await service.getJobStatus(jobId, userId);
            return {
                success: true,
                status: job.status,
                transcript: job.transcript,
                segments: job.segments,
                duration: job.duration,
                completedChunks: job.completedChunks,
                totalChunks: job.totalChunks,
            };
        }
        catch (error) {
            return handleServiceError(error, reply);
        }
    });
};
function handleServiceError(error, reply) {
    if (error instanceof ServiceError) {
        return reply.status(error.statusCode).send({
            error: { code: "SERVICE_ERROR", message: error.message },
        });
    }
    throw error;
}
export default transcriptionRoutes;
