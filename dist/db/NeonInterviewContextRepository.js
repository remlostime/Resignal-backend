import { neon } from "@neondatabase/serverless";
function mapRowToInterviewContext(row) {
    return {
        interviewId: row.interview_id,
        contextJson: typeof row.context_json === 'string'
            ? JSON.parse(row.context_json)
            : row.context_json,
        model: row.model,
        createdAt: new Date(row.created_at)
    };
}
export class NeonInterviewContextRepository {
    sql;
    constructor(databaseUrl) {
        this.sql = neon(databaseUrl ?? process.env.DATABASE_URL);
    }
    async createContext(interviewId, contextJson, model) {
        const createdAt = new Date();
        const rows = await this.sql `
      INSERT INTO interview_contexts (interview_id, context_json, model, created_at)
      VALUES (${interviewId}, ${JSON.stringify(contextJson)}::jsonb, ${model}, ${createdAt.toISOString()})
      RETURNING interview_id, context_json, model, created_at;
    `;
        return mapRowToInterviewContext(rows[0]);
    }
    async getContextByInterviewId(interviewId) {
        const rows = await this.sql `
      SELECT interview_id, context_json, model, created_at
      FROM interview_contexts
      WHERE interview_id = ${interviewId};
    `;
        if (rows.length === 0) {
            return null;
        }
        return mapRowToInterviewContext(rows[0]);
    }
}
