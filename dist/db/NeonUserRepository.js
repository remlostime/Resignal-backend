import { neon } from "@neondatabase/serverless";
function mapRowToUser(row) {
    return {
        id: row.id,
        email: row.email,
        plan: row.plan,
        createdAt: new Date(row.created_at)
    };
}
export class NeonUserRepository {
    sql;
    constructor(databaseUrl) {
        this.sql = neon(databaseUrl ?? process.env.DATABASE_URL);
    }
    async createUser(email, plan = "free") {
        const id = crypto.randomUUID();
        const createdAt = new Date();
        const rows = await this.sql `
      INSERT INTO users (id, email, plan, created_at)
      VALUES (${id}, ${email}, ${plan}, ${createdAt.toISOString()})
      ON CONFLICT DO NOTHING
      RETURNING id, email, plan, created_at;
    `;
        if (rows.length === 0) {
            return null;
        }
        return mapRowToUser(rows[0]);
    }
    async createUserWithId(id, email, plan = "free") {
        const createdAt = new Date();
        const rows = await this.sql `
      INSERT INTO users (id, email, plan, created_at)
      VALUES (${id}, ${email}, ${plan}, ${createdAt.toISOString()})
      ON CONFLICT DO NOTHING
      RETURNING id, email, plan, created_at;
    `;
        if (rows.length === 0) {
            return null;
        }
        return mapRowToUser(rows[0]);
    }
    async getUserById(id) {
        const rows = await this.sql `
      SELECT id, email, plan, created_at
      FROM users
      WHERE id = ${id};
    `;
        if (rows.length === 0) {
            return null;
        }
        return mapRowToUser(rows[0]);
    }
    async getUserByEmail(email) {
        const rows = await this.sql `
      SELECT id, email, plan, created_at
      FROM users
      WHERE email = ${email};
    `;
        if (rows.length === 0) {
            return null;
        }
        return mapRowToUser(rows[0]);
    }
}
