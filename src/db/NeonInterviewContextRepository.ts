import { neon } from "@neondatabase/serverless"
import type { InterviewContextRepository } from "./InterviewContextRepository.js"
import type { AIModel, InterviewContext } from "./types.js"

interface InterviewContextRow {
  interview_id: string
  context_json: string
  model: AIModel
  created_at: string
}

function mapRowToInterviewContext(row: InterviewContextRow): InterviewContext {
  return {
    interviewId: row.interview_id,
    contextJson: JSON.parse(row.context_json),
    model: row.model,
    createdAt: new Date(row.created_at)
  }
}

export class NeonInterviewContextRepository implements InterviewContextRepository {
  private sql

  constructor(databaseUrl?: string) {
    this.sql = neon(databaseUrl ?? process.env.DATABASE_URL!)
  }

  async createContext(interviewId: string, contextJson: any, model: AIModel): Promise<InterviewContext> {
    const createdAt = new Date()
    const contextJsonString = JSON.stringify(contextJson)

    const rows = await this.sql`
      INSERT INTO interview_contexts (interview_id, context_json, model, created_at)
      VALUES (${interviewId}, ${contextJsonString}, ${model}, ${createdAt.toISOString()})
      RETURNING interview_id, context_json, model, created_at;
    `

    return mapRowToInterviewContext(rows[0] as InterviewContextRow)
  }

  async getContextByInterviewId(interviewId: string): Promise<InterviewContext | null> {
    const rows = await this.sql`
      SELECT interview_id, context_json, model, created_at
      FROM interview_contexts
      WHERE interview_id = ${interviewId};
    `

    if (rows.length === 0) {
      return null
    }

    return mapRowToInterviewContext(rows[0] as InterviewContextRow)
  }
}
