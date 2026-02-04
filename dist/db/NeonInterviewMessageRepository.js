import { neon } from "@neondatabase/serverless";
function mapRowToInterviewMessage(row) {
    return {
        id: row.id,
        interviewId: row.interview_id,
        role: row.role,
        content: row.content,
        createdAt: new Date(row.created_at)
    };
}
export class NeonInterviewMessageRepository {
    sql;
    constructor(databaseUrl) {
        this.sql = neon(databaseUrl ?? process.env.DATABASE_URL);
    }
    async createMessage(interviewId, role, content) {
        const id = crypto.randomUUID();
        const createdAt = new Date();
        const rows = await this.sql `
      INSERT INTO interview_messages (id, interview_id, role, content, created_at)
      VALUES (${id}, ${interviewId}, ${role}, ${content}, ${createdAt.toISOString()})
      RETURNING id, interview_id, role, content, created_at;
    `;
        return mapRowToInterviewMessage(rows[0]);
    }
    async getMessageById(id) {
        const rows = await this.sql `
      SELECT id, interview_id, role, content, created_at
      FROM interview_messages
      WHERE id = ${id};
    `;
        if (rows.length === 0) {
            return null;
        }
        return mapRowToInterviewMessage(rows[0]);
    }
    async getMessagesByInterviewId(interviewId) {
        const rows = await this.sql `
      SELECT id, interview_id, role, content, created_at
      FROM interview_messages
      WHERE interview_id = ${interviewId}
      ORDER BY created_at ASC;
    `;
        return rows.map(row => mapRowToInterviewMessage(row));
    }
}
