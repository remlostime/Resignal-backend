import { neon } from "@neondatabase/serverless"
import type { TranscriptionJobRepository } from "./TranscriptionJobRepository.js"
import type { TranscriptionJob, TranscriptionChunk } from "./types.js"

interface JobRow {
  id: string
  user_id: string
  status: string
  transcript: string | null
  segments: unknown | null
  duration: number | null
  result_url: string | null
  total_chunks: number
  completed_chunks: number
  error_message: string | null
  created_at: string
  updated_at: string
}

interface ChunkRow {
  id: string
  job_id: string
  chunk_index: number
  blob_url: string
  status: string
  transcript: string | null
  segments: unknown | null
  duration: number | null
  error_message: string | null
  created_at: string
}

function mapRowToJob(row: JobRow): TranscriptionJob {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status as TranscriptionJob["status"],
    transcript: row.transcript,
    segments: row.segments,
    duration: row.duration,
    resultUrl: row.result_url,
    totalChunks: row.total_chunks,
    completedChunks: row.completed_chunks,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapRowToChunk(row: ChunkRow): TranscriptionChunk {
  return {
    id: row.id,
    jobId: row.job_id,
    chunkIndex: row.chunk_index,
    blobUrl: row.blob_url,
    status: row.status as TranscriptionChunk["status"],
    transcript: row.transcript,
    segments: row.segments,
    duration: row.duration,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at),
  }
}

export class NeonTranscriptionJobRepository implements TranscriptionJobRepository {
  private sql

  constructor(databaseUrl?: string) {
    this.sql = neon(databaseUrl ?? process.env.DATABASE_URL!)
  }

  async createJob(userId: string, totalChunks: number): Promise<TranscriptionJob> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const rows = await this.sql`
      INSERT INTO transcription_jobs (id, user_id, status, total_chunks, completed_chunks, created_at, updated_at)
      VALUES (${id}, ${userId}, 'pending', ${totalChunks}, 0, ${now}, ${now})
      RETURNING *;
    `

    return mapRowToJob(rows[0] as JobRow)
  }

  async getJobById(id: string): Promise<TranscriptionJob | null> {
    const rows = await this.sql`
      SELECT * FROM transcription_jobs WHERE id = ${id};
    `
    return rows.length === 0 ? null : mapRowToJob(rows[0] as JobRow)
  }

  async getJobByIdAndUserId(id: string, userId: string): Promise<TranscriptionJob | null> {
    const rows = await this.sql`
      SELECT * FROM transcription_jobs WHERE id = ${id} AND user_id = ${userId};
    `
    return rows.length === 0 ? null : mapRowToJob(rows[0] as JobRow)
  }

  async updateJobStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const now = new Date().toISOString()
    await this.sql`
      UPDATE transcription_jobs
      SET status = ${status}, error_message = ${errorMessage ?? null}, updated_at = ${now}
      WHERE id = ${id};
    `
  }

  async updateJobResult(id: string, transcript: string, segments: unknown, duration: number): Promise<void> {
    const now = new Date().toISOString()
    const segmentsJson = JSON.stringify(segments)
    await this.sql`
      UPDATE transcription_jobs
      SET status = 'completed', transcript = ${transcript}, segments = ${segmentsJson}::jsonb,
          duration = ${duration}, updated_at = ${now}
      WHERE id = ${id};
    `
  }

  async updateJobResultUrl(id: string, resultUrl: string, duration: number): Promise<void> {
    const now = new Date().toISOString()
    await this.sql`
      UPDATE transcription_jobs
      SET status = 'completed', result_url = ${resultUrl}, duration = ${duration}, updated_at = ${now}
      WHERE id = ${id};
    `
  }

  async incrementCompletedChunks(id: string): Promise<number> {
    const now = new Date().toISOString()
    const rows = await this.sql`
      UPDATE transcription_jobs
      SET completed_chunks = completed_chunks + 1, updated_at = ${now}
      WHERE id = ${id}
      RETURNING completed_chunks;
    `
    return (rows[0] as { completed_chunks: number }).completed_chunks
  }

  async createChunk(jobId: string, chunkIndex: number, blobUrl: string): Promise<TranscriptionChunk> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const rows = await this.sql`
      INSERT INTO transcription_chunks (id, job_id, chunk_index, blob_url, status, created_at)
      VALUES (${id}, ${jobId}, ${chunkIndex}, ${blobUrl}, 'pending', ${now})
      RETURNING *;
    `

    return mapRowToChunk(rows[0] as ChunkRow)
  }

  async getChunksByJobId(jobId: string): Promise<TranscriptionChunk[]> {
    const rows = await this.sql`
      SELECT * FROM transcription_chunks
      WHERE job_id = ${jobId}
      ORDER BY chunk_index ASC;
    `
    return rows.map(row => mapRowToChunk(row as ChunkRow))
  }

  async getChunkByJobIdAndIndex(jobId: string, chunkIndex: number): Promise<TranscriptionChunk | null> {
    const rows = await this.sql`
      SELECT * FROM transcription_chunks
      WHERE job_id = ${jobId} AND chunk_index = ${chunkIndex};
    `
    return rows.length === 0 ? null : mapRowToChunk(rows[0] as ChunkRow)
  }

  async updateChunkStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    await this.sql`
      UPDATE transcription_chunks
      SET status = ${status}, error_message = ${errorMessage ?? null}
      WHERE id = ${id};
    `
  }

  async updateChunkResult(id: string, transcript: string, segments: unknown, duration: number): Promise<void> {
    const segmentsJson = JSON.stringify(segments)
    await this.sql`
      UPDATE transcription_chunks
      SET status = 'completed', transcript = ${transcript}, segments = ${segmentsJson}::jsonb, duration = ${duration}
      WHERE id = ${id};
    `
  }

  async countChunksByJobId(jobId: string): Promise<number> {
    const rows = await this.sql`
      SELECT COUNT(*)::int AS count FROM transcription_chunks WHERE job_id = ${jobId};
    `
    return (rows[0] as { count: number }).count
  }
}
