import { neon } from "@neondatabase/serverless";
function mapRowToInterview(row) {
    return {
        id: row.id,
        userId: row.user_id,
        transcript: row.transcript,
        createdAt: new Date(row.created_at)
    };
}
function mapRowToInterviewListItem(row) {
    return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        createdAt: new Date(row.created_at)
    };
}
export class NeonInterviewRepository {
    sql;
    constructor(databaseUrl) {
        this.sql = neon(databaseUrl ?? process.env.DATABASE_URL);
    }
    async createInterview(userId, transcript) {
        const id = crypto.randomUUID();
        const createdAt = new Date();
        const rows = await this.sql `
      INSERT INTO interviews (id, user_id, transcript, created_at)
      VALUES (${id}, ${userId}, ${transcript}, ${createdAt.toISOString()})
      RETURNING id, user_id, transcript, created_at;
    `;
        return mapRowToInterview(rows[0]);
    }
    async getInterviewById(id) {
        const rows = await this.sql `
      SELECT id, user_id, transcript, created_at
      FROM interviews
      WHERE id = ${id};
    `;
        if (rows.length === 0) {
            return null;
        }
        return mapRowToInterview(rows[0]);
    }
    async getInterviewsByUserId(userId) {
        const rows = await this.sql `
      SELECT id, user_id, transcript, created_at
      FROM interviews
      WHERE user_id = ${userId}
      ORDER BY created_at DESC;
    `;
        return rows.map(row => mapRowToInterview(row));
    }
    async getPaginatedInterviewsByUserId(userId, page, pageSize) {
        const offset = (page - 1) * pageSize;
        const [countRows, rows] = await Promise.all([
            this.sql `
        SELECT COUNT(*) AS total
        FROM interviews
        WHERE user_id = ${userId};
      `,
            this.sql `
        SELECT i.id, i.created_at,
               ic.context_json->>'title' AS title,
               ic.context_json->>'summary' AS summary
        FROM interviews i
        LEFT JOIN interview_contexts ic ON i.id = ic.interview_id
        WHERE i.user_id = ${userId}
        ORDER BY i.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset};
      `
        ]);
        const total = parseInt(countRows[0]?.total, 10) || 0;
        return {
            items: rows.map(row => mapRowToInterviewListItem(row)),
            total
        };
    }
    async deleteInterview(id) {
        const rows = await this.sql `
      DELETE FROM interviews
      WHERE id = ${id}
      RETURNING id;
    `;
        return rows.length > 0;
    }
}
