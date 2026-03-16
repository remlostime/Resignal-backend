import {} from "fastify";
import { Receiver } from "@upstash/qstash";
import { NeonTranscriptionJobRepository } from "../../../db/NeonTranscriptionJobRepository.js";
import { TranscriptionProcessor } from "../../../jobs/TranscriptionProcessor.js";
const processChunkRoutes = async (server) => {
    const repository = new NeonTranscriptionJobRepository();
    const processor = new TranscriptionProcessor(repository);
    const receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    });
    // POST /process-transcription-chunk — Invoked by QStash, not by clients.
    // Each invocation processes a single audio chunk through OpenAI Whisper,
    // keeping well within Vercel Hobby's 60s function duration limit.
    server.post("/process-transcription-chunk", {
        config: {
            rawBody: true,
        },
    }, async (request, reply) => {
        const signature = request.headers["upstash-signature"];
        if (!signature) {
            return reply.status(401).send({ error: "Missing signature" });
        }
        try {
            const rawBody = typeof request.body === "string"
                ? request.body
                : JSON.stringify(request.body);
            await receiver.verify({ signature, body: rawBody });
        }
        catch {
            return reply.status(401).send({ error: "Invalid signature" });
        }
        const { jobId, chunkIndex } = request.body;
        if (!jobId || chunkIndex === undefined) {
            return reply.status(400).send({ error: "Missing jobId or chunkIndex" });
        }
        try {
            await processor.processChunk(jobId, chunkIndex);
            return { success: true };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            server.log.error(`Chunk processing failed: job=${jobId} chunk=${chunkIndex} error=${message}`);
            return reply.status(500).send({ error: message });
        }
    });
};
export default processChunkRoutes;
