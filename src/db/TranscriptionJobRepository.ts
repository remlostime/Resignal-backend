import type { TranscriptionJob, TranscriptionChunk } from "./types.js"

export interface TranscriptionJobRepository {
  createJob(userId: string, totalChunks: number): Promise<TranscriptionJob>
  getJobById(id: string): Promise<TranscriptionJob | null>
  getJobByIdAndUserId(id: string, userId: string): Promise<TranscriptionJob | null>
  updateJobStatus(id: string, status: string, errorMessage?: string): Promise<void>
  updateJobResult(id: string, transcript: string, segments: unknown, duration: number): Promise<void>
  updateJobResultUrl(id: string, resultUrl: string, duration: number): Promise<void>
  incrementCompletedChunks(id: string): Promise<number>

  createChunk(jobId: string, chunkIndex: number, blobUrl: string): Promise<TranscriptionChunk>
  getChunksByJobId(jobId: string): Promise<TranscriptionChunk[]>
  getChunkByJobIdAndIndex(jobId: string, chunkIndex: number): Promise<TranscriptionChunk | null>
  updateChunkStatus(id: string, status: string, errorMessage?: string): Promise<void>
  updateChunkResult(id: string, transcript: string, segments: unknown, duration: number): Promise<void>
  countChunksByJobId(jobId: string): Promise<number>
}
