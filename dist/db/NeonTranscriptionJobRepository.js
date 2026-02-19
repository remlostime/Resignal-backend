import { neon } from "@neondatabase/serverless";
function mapRowToJob(row) {
    return {
        id: row.id,
        userId: row.user_id,
        status: row.status,
        transcript: row.transcript,
        segments: row.segments,
        duration: row.duration,
        totalChunks: row.total_chunks,
        completedChunks: row.completed_chunks,
        errorMessage: row.error_message,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
function mapRowToChunk(row) {
    return {
        id: row.id,
        jobId: row.job_id,
        chunkIndex: row.chunk_index,
        blobUrl: row.blob_url,
        status: row.status,
        transcript: row.transcript,
        segments: row.segments,
        duration: row.duration,
        errorMessage: row.error_message,
        createdAt: new Date(row.created_at),
    };
}
export class NeonTranscriptionJobRepository {
    sql;
    constructor(databaseUrl) {
        this.sql = neon(databaseUrl ?? process.env.DATABASE_URL);
    }
    async createJob(userId, totalChunks) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const rows = await this.sql `
      INSERT INTO transcription_jobs (id, user_id, status, total_chunks, completed_chunks, created_at, updated_at)
      VALUES (${id}, ${userId}, 'pending', ${totalChunks}, 0, ${now}, ${now})
      RETURNING *;
    `;
        return mapRowToJob(rows[0]);
    }
    async getJobById(id) {
        const rows = await this.sql `
      SELECT * FROM transcription_jobs WHERE id = ${id};
    `;
        return rows.length === 0 ? null : mapRowToJob(rows[0]);
    }
    async getJobByIdAndUserId(id, userId) {
        const rows = await this.sql `
      SELECT * FROM transcription_jobs WHERE id = ${id} AND user_id = ${userId};
    `;
        return rows.length === 0 ? null : mapRowToJob(rows[0]);
    }
    async updateJobStatus(id, status, errorMessage) {
        const now = new Date().toISOString();
        await this.sql `
      UPDATE transcription_jobs
      SET status = ${status}, error_message = ${errorMessage ?? null}, updated_at = ${now}
      WHERE id = ${id};
    `;
    }
    async updateJobResult(id, transcript, segments, duration) {
        const now = new Date().toISOString();
        const segmentsJson = JSON.stringify(segments);
        await this.sql `
      UPDATE transcription_jobs
      SET status = 'completed', transcript = ${transcript}, segments = ${segmentsJson}::jsonb,
          duration = ${duration}, updated_at = ${now}
      WHERE id = ${id};
    `;
    }
    async incrementCompletedChunks(id) {
        const now = new Date().toISOString();
        const rows = await this.sql `
      UPDATE transcription_jobs
      SET completed_chunks = completed_chunks + 1, updated_at = ${now}
      WHERE id = ${id}
      RETURNING completed_chunks;
    `;
        return rows[0].completed_chunks;
    }
    async createChunk(jobId, chunkIndex, blobUrl) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const rows = await this.sql `
      INSERT INTO transcription_chunks (id, job_id, chunk_index, blob_url, status, created_at)
      VALUES (${id}, ${jobId}, ${chunkIndex}, ${blobUrl}, 'pending', ${now})
      RETURNING *;
    `;
        return mapRowToChunk(rows[0]);
    }
    async getChunksByJobId(jobId) {
        const rows = await this.sql `
      SELECT * FROM transcription_chunks
      WHERE job_id = ${jobId}
      ORDER BY chunk_index ASC;
    `;
        return rows.map(row => mapRowToChunk(row));
    }
    async getChunkByJobIdAndIndex(jobId, chunkIndex) {
        const rows = await this.sql `
      SELECT * FROM transcription_chunks
      WHERE job_id = ${jobId} AND chunk_index = ${chunkIndex};
    `;
        return rows.length === 0 ? null : mapRowToChunk(rows[0]);
    }
    async updateChunkStatus(id, status, errorMessage) {
        await this.sql `
      UPDATE transcription_chunks
      SET status = ${status}, error_message = ${errorMessage ?? null}
      WHERE id = ${id};
    `;
    }
    async updateChunkResult(id, transcript, segments, duration) {
        const segmentsJson = JSON.stringify(segments);
        await this.sql `
      UPDATE transcription_chunks
      SET status = 'completed', transcript = ${transcript}, segments = ${segmentsJson}::jsonb, duration = ${duration}
      WHERE id = ${id};
    `;
    }
    async countChunksByJobId(jobId) {
        const rows = await this.sql `
      SELECT COUNT(*)::int AS count FROM transcription_chunks WHERE job_id = ${jobId};
    `;
        return rows[0].count;
    }
}
