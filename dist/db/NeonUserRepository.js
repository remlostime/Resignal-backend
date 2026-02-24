import { neon } from "@neondatabase/serverless";
function mapRowToUser(row) {
    return {
        id: row.id,
        anonymousId: row.anonymous_id,
        email: row.email,
        plan: row.plan,
        subscriptionExpiresAt: row.subscription_expires_at ? new Date(row.subscription_expires_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
export class NeonUserRepository {
    sql;
    constructor(databaseUrl) {
        this.sql = neon(databaseUrl ?? process.env.DATABASE_URL);
    }
    async createAnonymousUser(anonymousId) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const rows = await this.sql `
      INSERT INTO users (id, anonymous_id, plan, created_at, updated_at)
      VALUES (${id}, ${anonymousId}, 'free', ${now}, ${now})
      RETURNING id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at;
    `;
        return mapRowToUser(rows[0]);
    }
    async getUserById(id) {
        const rows = await this.sql `
      SELECT id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at
      FROM users
      WHERE id = ${id};
    `;
        if (rows.length === 0)
            return null;
        return mapRowToUser(rows[0]);
    }
    async getUserByAnonymousId(anonymousId) {
        const rows = await this.sql `
      SELECT id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at
      FROM users
      WHERE anonymous_id = ${anonymousId};
    `;
        if (rows.length === 0)
            return null;
        return mapRowToUser(rows[0]);
    }
    async getUserByEmail(email) {
        const rows = await this.sql `
      SELECT id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at
      FROM users
      WHERE email = ${email};
    `;
        if (rows.length === 0)
            return null;
        return mapRowToUser(rows[0]);
    }
    async updateSubscription(userId, plan, expiresAt) {
        const now = new Date().toISOString();
        const rows = await this.sql `
      UPDATE users
      SET plan = ${plan},
          subscription_expires_at = ${expiresAt.toISOString()},
          updated_at = ${now}
      WHERE id = ${userId}
      RETURNING id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at;
    `;
        if (rows.length === 0)
            return null;
        return mapRowToUser(rows[0]);
    }
}
