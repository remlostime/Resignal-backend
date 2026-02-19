import { OpenAI } from "openai"
import { del } from "@vercel/blob"
import type { TranscriptionJobRepository } from "../db/TranscriptionJobRepository.js"

interface WhisperSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
}

interface WhisperVerboseResponse {
  text: string
  segments: WhisperSegment[]
  duration: number
}

const MAX_WHISPER_RETRIES = 1

export class TranscriptionProcessor {
  private repository: TranscriptionJobRepository
  private openai: OpenAI

  constructor(repository: TranscriptionJobRepository) {
    this.repository = repository
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  }

  async processChunk(jobId: string, chunkIndex: number): Promise<void> {
    const chunk = await this.repository.getChunkByJobIdAndIndex(jobId, chunkIndex)
    if (!chunk) {
      throw new Error(`Chunk ${chunkIndex} not found for job ${jobId}`)
    }

    await this.repository.updateChunkStatus(chunk.id, "processing")

    try {
      const audioBuffer = await this.downloadBlob(chunk.blobUrl)
      const filename = this.extractFilename(chunk.blobUrl)
      const result = await this.callWhisper(audioBuffer, filename)

      await this.repository.updateChunkResult(
        chunk.id,
        result.text,
        result.segments,
        result.duration,
      )

      await del(chunk.blobUrl)

      const completedCount = await this.repository.incrementCompletedChunks(jobId)
      const job = await this.repository.getJobById(jobId)

      if (job && completedCount >= job.totalChunks) {
        await this.combineChunks(jobId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      await this.repository.updateChunkStatus(chunk.id, "failed", message)
      await this.repository.updateJobStatus(jobId, "failed", `Chunk ${chunkIndex} failed: ${message}`)
    }
  }

  /**
   * Merges all completed chunk transcripts in order, offsetting segment
   * timestamps by the cumulative duration of preceding chunks.
   */
  async combineChunks(jobId: string): Promise<void> {
    const chunks = await this.repository.getChunksByJobId(jobId)

    let combinedText = ""
    const combinedSegments: WhisperSegment[] = []
    let totalDuration = 0
    let timeOffset = 0

    for (const chunk of chunks) {
      if (chunk.status !== "completed" || !chunk.transcript) {
        await this.repository.updateJobStatus(
          jobId,
          "failed",
          `Chunk ${chunk.chunkIndex} is not completed`,
        )
        return
      }

      if (combinedText.length > 0) {
        combinedText += " "
      }
      combinedText += chunk.transcript

      const segments = (chunk.segments ?? []) as WhisperSegment[]
      for (const seg of segments) {
        combinedSegments.push({
          ...seg,
          start: seg.start + timeOffset,
          end: seg.end + timeOffset,
        })
      }

      const chunkDuration = chunk.duration ?? 0
      timeOffset += chunkDuration
      totalDuration += chunkDuration
    }

    await this.repository.updateJobResult(
      jobId,
      combinedText,
      combinedSegments,
      totalDuration,
    )
  }

  private async callWhisper(audioBuffer: Buffer, filename: string): Promise<WhisperVerboseResponse> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= MAX_WHISPER_RETRIES; attempt++) {
      try {
        const arrayBuffer = audioBuffer.buffer.slice(
          audioBuffer.byteOffset,
          audioBuffer.byteOffset + audioBuffer.byteLength,
        ) as ArrayBuffer
        const file = new File([arrayBuffer], filename, { type: this.mimeFromFilename(filename) })

        const response = await this.openai.audio.transcriptions.create({
          model: "whisper-1",
          file,
          response_format: "verbose_json",
        })

        return response as unknown as WhisperVerboseResponse
      } catch (error) {
        lastError = error as Error
        if (attempt < MAX_WHISPER_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    throw lastError
  }

  private async downloadBlob(url: string): Promise<Buffer> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  private extractFilename(blobUrl: string): string {
    const path = new URL(blobUrl).pathname
    const segments = path.split("/")
    return segments[segments.length - 1] ?? "audio.mp3"
  }

  private mimeFromFilename(filename: string): string {
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase()
    const mimeMap: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".m4a": "audio/mp4",
      ".mp4": "audio/mp4",
      ".wav": "audio/wav",
      ".webm": "audio/webm",
    }
    return mimeMap[ext] ?? "audio/mpeg"
  }
}
