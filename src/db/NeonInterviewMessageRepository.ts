import { neon } from "@neondatabase/serverless"
import type { InterviewMessageRepository } from "./InterviewMessageRepository.js"
import type { InterviewMessage, Role } from "./types.js"

interface InterviewMessageRow {
  id: string
  interview_id: string
  role: Role
  content: string
  created_at: string
}

function mapRowToInterviewMessage(row: InterviewMessageRow): InterviewMessage {
  return {
    id: row.id,
    interviewId: row.interview_id,
    role: row.role,
    content: row.content,
    createdAt: new Date(row.created_at)
  }
}

export class NeonInterviewMessageRepository implements InterviewMessageRepository {
  private sql

  constructor(databaseUrl?: string) {
    this.sql = neon(databaseUrl ?? process.env.DATABASE_URL!)
  }

  async createMessage(interviewId: string, role: Role, content: string): Promise<InterviewMessage> {
    const id = crypto.randomUUID()
    const createdAt = new Date()

    const rows = await this.sql`
      INSERT INTO interview_messages (id, interview_id, role, content, created_at)
      VALUES (${id}, ${interviewId}, ${role}, ${content}, ${createdAt.toISOString()})
      RETURNING id, interview_id, role, content, created_at;
    `

    return mapRowToInterviewMessage(rows[0] as InterviewMessageRow)
  }

  async getMessageById(id: string): Promise<InterviewMessage | null> {
    const rows = await this.sql`
      SELECT id, interview_id, role, content, created_at
      FROM interview_messages
      WHERE id = ${id};
    `

    if (rows.length === 0) {
      return null
    }

    return mapRowToInterviewMessage(rows[0] as InterviewMessageRow)
  }

  async getMessagesByInterviewId(interviewId: string): Promise<InterviewMessage[]> {
    const rows = await this.sql`
      SELECT id, interview_id, role, content, created_at
      FROM interview_messages
      WHERE interview_id = ${interviewId}
      ORDER BY created_at ASC;
    `

    return rows.map(row => mapRowToInterviewMessage(row as InterviewMessageRow))
  }

  async deleteByInterviewId(interviewId: string): Promise<void> {
    await this.sql`
      DELETE FROM interview_messages
      WHERE interview_id = ${interviewId};
    `
  }
}
