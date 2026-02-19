import { OpenAI } from "openai";
import { del } from "@vercel/blob";
const MAX_WHISPER_RETRIES = 1;
export class TranscriptionProcessor {
    repository;
    openai;
    constructor(repository) {
        this.repository = repository;
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    async processChunk(jobId, chunkIndex) {
        const chunk = await this.repository.getChunkByJobIdAndIndex(jobId, chunkIndex);
        if (!chunk) {
            throw new Error(`Chunk ${chunkIndex} not found for job ${jobId}`);
        }
        await this.repository.updateChunkStatus(chunk.id, "processing");
        try {
            const audioBuffer = await this.downloadBlob(chunk.blobUrl);
            const filename = this.extractFilename(chunk.blobUrl);
            const result = await this.callWhisper(audioBuffer, filename);
            await this.repository.updateChunkResult(chunk.id, result.text, result.segments, result.duration);
            await del(chunk.blobUrl);
            const completedCount = await this.repository.incrementCompletedChunks(jobId);
            const job = await this.repository.getJobById(jobId);
            if (job && completedCount >= job.totalChunks) {
                await this.combineChunks(jobId);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            await this.repository.updateChunkStatus(chunk.id, "failed", message);
            await this.repository.updateJobStatus(jobId, "failed", `Chunk ${chunkIndex} failed: ${message}`);
        }
    }
    /**
     * Merges all completed chunk transcripts in order, offsetting segment
     * timestamps by the cumulative duration of preceding chunks.
     */
    async combineChunks(jobId) {
        const chunks = await this.repository.getChunksByJobId(jobId);
        let combinedText = "";
        const combinedSegments = [];
        let totalDuration = 0;
        let timeOffset = 0;
        for (const chunk of chunks) {
            if (chunk.status !== "completed" || !chunk.transcript) {
                await this.repository.updateJobStatus(jobId, "failed", `Chunk ${chunk.chunkIndex} is not completed`);
                return;
            }
            if (combinedText.length > 0) {
                combinedText += " ";
            }
            combinedText += chunk.transcript;
            const segments = (chunk.segments ?? []);
            for (const seg of segments) {
                combinedSegments.push({
                    ...seg,
                    start: seg.start + timeOffset,
                    end: seg.end + timeOffset,
                });
            }
            const chunkDuration = chunk.duration ?? 0;
            timeOffset += chunkDuration;
            totalDuration += chunkDuration;
        }
        await this.repository.updateJobResult(jobId, combinedText, combinedSegments, totalDuration);
    }
    async callWhisper(audioBuffer, filename) {
        let lastError;
        for (let attempt = 0; attempt <= MAX_WHISPER_RETRIES; attempt++) {
            try {
                const arrayBuffer = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength);
                const file = new File([arrayBuffer], filename, { type: this.mimeFromFilename(filename) });
                const response = await this.openai.audio.transcriptions.create({
                    model: "whisper-1",
                    file,
                    response_format: "verbose_json",
                });
                return response;
            }
            catch (error) {
                lastError = error;
                if (attempt < MAX_WHISPER_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        throw lastError;
    }
    async downloadBlob(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download blob: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    extractFilename(blobUrl) {
        const path = new URL(blobUrl).pathname;
        const segments = path.split("/");
        return segments[segments.length - 1] ?? "audio.mp3";
    }
    mimeFromFilename(filename) {
        const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
        const mimeMap = {
            ".mp3": "audio/mpeg",
            ".m4a": "audio/mp4",
            ".mp4": "audio/mp4",
            ".wav": "audio/wav",
            ".webm": "audio/webm",
        };
        return mimeMap[ext] ?? "audio/mpeg";
    }
}
