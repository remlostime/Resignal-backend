import { neon } from "@neondatabase/serverless";
function mapRowToInterview(row) {
    return {
        id: row.id,
        userId: row.user_id,
        transcript: row.transcript,
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
    async deleteInterview(id) {
        const rows = await this.sql `
      DELETE FROM interviews
      WHERE id = ${id}
      RETURNING id;
    `;
        return rows.length > 0;
    }
}
