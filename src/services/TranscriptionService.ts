import { put } from "@vercel/blob"
import { Client as QStashClient } from "@upstash/qstash"
import type { TranscriptionJobRepository } from "../db/TranscriptionJobRepository.js"
import type { TranscriptionJob } from "../db/types.js"

const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
]

const ALLOWED_EXTENSIONS = [".mp3", ".m4a", ".mp4", ".wav", ".webm"]

const MAX_CHUNK_SIZE_BYTES = 25 * 1024 * 1024 // 25MB — OpenAI Whisper limit

export class TranscriptionService {
  private repository: TranscriptionJobRepository
  private qstash: QStashClient

  constructor(repository: TranscriptionJobRepository) {
    this.repository = repository
    this.qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! })
  }

  async createJob(userId: string, totalChunks: number): Promise<TranscriptionJob> {
    if (totalChunks < 1 || totalChunks > 20) {
      throw new ServiceError("totalChunks must be between 1 and 20", 400)
    }

    return this.repository.createJob(userId, totalChunks)
  }

  async uploadChunk(
    jobId: string,
    userId: string,
    chunkIndex: number,
    audioBuffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ chunksUploaded: number; totalChunks: number }> {
    const job = await this.repository.getJobByIdAndUserId(jobId, userId)
    if (!job) {
      throw new ServiceError("Transcription job not found", 404)
    }
    if (job.status !== "pending") {
      throw new ServiceError("Job is no longer accepting uploads", 409)
    }

    this.validateAudioFile(filename, mimetype, audioBuffer.length)

    if (chunkIndex < 0 || chunkIndex >= job.totalChunks) {
      throw new ServiceError(`chunkIndex must be between 0 and ${job.totalChunks - 1}`, 400)
    }

    const existing = await this.repository.getChunkByJobIdAndIndex(jobId, chunkIndex)
    if (existing) {
      throw new ServiceError(`Chunk ${chunkIndex} already uploaded`, 409)
    }

    const blobPath = `transcriptions/${jobId}/chunk_${chunkIndex}_${filename}`
    const blob = await put(blobPath, audioBuffer, { access: "public" })

    await this.repository.createChunk(jobId, chunkIndex, blob.url)

    const chunksUploaded = await this.repository.countChunksByJobId(jobId)

    if (chunksUploaded === job.totalChunks) {
      await this.triggerProcessing(job)
    }

    return { chunksUploaded, totalChunks: job.totalChunks }
  }

  async getJobStatus(jobId: string, userId: string): Promise<TranscriptionJob> {
    const job = await this.repository.getJobByIdAndUserId(jobId, userId)
    if (!job) {
      throw new ServiceError("Transcription job not found", 404)
    }
    return job
  }

  /**
   * Publishes one QStash message per chunk so each runs in its own
   * serverless invocation, staying within Vercel Hobby's 60s limit.
   */
  private async triggerProcessing(job: TranscriptionJob): Promise<void> {
    await this.repository.updateJobStatus(job.id, "processing")

    const webhookUrl = `${process.env.APP_URL}/api/internal/process-transcription-chunk`

    for (let i = 0; i < job.totalChunks; i++) {
      await this.qstash.publishJSON({
        url: webhookUrl,
        body: { jobId: job.id, chunkIndex: i },
        retries: 1,
      })
    }
  }

  private validateAudioFile(filename: string, mimetype: string, size: number): void {
    if (!ALLOWED_AUDIO_MIME_TYPES.includes(mimetype)) {
      throw new ServiceError(
        `Invalid audio type "${mimetype}". Allowed: ${ALLOWED_AUDIO_MIME_TYPES.join(", ")}`,
        400,
      )
    }

    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ServiceError(
        `Invalid file extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        400,
      )
    }

    if (size > MAX_CHUNK_SIZE_BYTES) {
      throw new ServiceError(
        `File size ${(size / 1024 / 1024).toFixed(1)}MB exceeds the 25MB limit`,
        400,
      )
    }
  }
}

export class ServiceError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = "ServiceError"
    this.statusCode = statusCode
  }
}
