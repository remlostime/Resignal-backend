import {} from "fastify";
import { rateLimit } from "../../lib/rateLimit.js";
import { TranscriptionService, ServiceError } from "../../services/TranscriptionService.js";
import { NeonTranscriptionJobRepository } from "../../db/NeonTranscriptionJobRepository.js";
const transcriptionRoutes = async (server) => {
    const repository = new NeonTranscriptionJobRepository();
    const service = new TranscriptionService(repository);
    // POST / — Create a new transcription job.
    // Returns immediately with a jobId; no audio processing happens here.
    server.post("/", async (request, reply) => {
        const clientId = request.headers["x-client-id"];
        if (!clientId) {
            return reply.status(401).send({ error: "Missing x-client-id header" });
        }
        if (!rateLimit(clientId)) {
            return reply.status(429).send({ error: "Rate limit exceeded" });
        }
        const { totalChunks } = request.body;
        if (!totalChunks || typeof totalChunks !== "number") {
            return reply.status(400).send({ error: "totalChunks is required and must be a number" });
        }
        try {
            const job = await service.createJob(clientId, totalChunks);
            return { success: true, jobId: job.id, status: job.status };
        }
        catch (error) {
            return handleServiceError(error, reply);
        }
    });
    // POST /:jobId/chunks — Upload one audio chunk (multipart/form-data).
    // When the last chunk is uploaded, background processing is triggered
    // via QStash so each chunk gets its own 60s serverless invocation.
    server.post("/:jobId/chunks", async (request, reply) => {
        const clientId = request.headers["x-client-id"];
        if (!clientId) {
            return reply.status(401).send({ error: "Missing x-client-id header" });
        }
        const { jobId } = request.params;
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ error: "No file uploaded. Use field name 'audio'." });
        }
        const chunkIndexField = data.fields["chunkIndex"];
        if (!chunkIndexField || !("value" in chunkIndexField)) {
            return reply.status(400).send({ error: "Missing chunkIndex field" });
        }
        const chunkIndex = parseInt(chunkIndexField.value, 10);
        if (Number.isNaN(chunkIndex)) {
            return reply.status(400).send({ error: "chunkIndex must be a number" });
        }
        try {
            const audioBuffer = await data.toBuffer();
            const result = await service.uploadChunk(jobId, clientId, chunkIndex, audioBuffer, data.filename, data.mimetype);
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
    // GET /:jobId — Poll transcription job status.
    // Client calls this repeatedly until status is "completed" or "failed".
    server.get("/:jobId", async (request, reply) => {
        const clientId = request.headers["x-client-id"];
        if (!clientId) {
            return reply.status(401).send({ error: "Missing x-client-id header" });
        }
        const { jobId } = request.params;
        try {
            const job = await service.getJobStatus(jobId, clientId);
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
        return reply.status(error.statusCode).send({ error: error.message });
    }
    throw error;
}
export default transcriptionRoutes;
