import { neon } from "@neondatabase/serverless"
import type { UserRepository } from "./UserRepository.js"
import type { Plan, User } from "./types.js"

interface UserRow {
  id: string
  anonymous_id: string
  email: string | null
  plan: Plan
  subscription_expires_at: string | null
  created_at: string
  updated_at: string
}

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    anonymousId: row.anonymous_id,
    email: row.email,
    plan: row.plan,
    subscriptionExpiresAt: row.subscription_expires_at ? new Date(row.subscription_expires_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export class NeonUserRepository implements UserRepository {
  private sql

  constructor(databaseUrl?: string) {
    this.sql = neon(databaseUrl ?? process.env.DATABASE_URL!)
  }

  async createAnonymousUser(anonymousId: string): Promise<User> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const rows = await this.sql`
      INSERT INTO users (id, anonymous_id, plan, created_at, updated_at)
      VALUES (${id}, ${anonymousId}, 'free', ${now}, ${now})
      RETURNING id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at;
    `

    return mapRowToUser(rows[0] as UserRow)
  }

  async getUserById(id: string): Promise<User | null> {
    const rows = await this.sql`
      SELECT id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at
      FROM users
      WHERE id = ${id};
    `

    if (rows.length === 0) return null
    return mapRowToUser(rows[0] as UserRow)
  }

  async getUserByAnonymousId(anonymousId: string): Promise<User | null> {
    const rows = await this.sql`
      SELECT id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at
      FROM users
      WHERE anonymous_id = ${anonymousId};
    `

    if (rows.length === 0) return null
    return mapRowToUser(rows[0] as UserRow)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const rows = await this.sql`
      SELECT id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at
      FROM users
      WHERE email = ${email};
    `

    if (rows.length === 0) return null
    return mapRowToUser(rows[0] as UserRow)
  }

  async updateSubscription(userId: string, plan: Plan, expiresAt: Date): Promise<User | null> {
    const now = new Date().toISOString()

    const rows = await this.sql`
      UPDATE users
      SET plan = ${plan},
          subscription_expires_at = ${expiresAt.toISOString()},
          updated_at = ${now}
      WHERE id = ${userId}
      RETURNING id, anonymous_id, email, plan, subscription_expires_at, created_at, updated_at;
    `

    if (rows.length === 0) return null
    return mapRowToUser(rows[0] as UserRow)
  }
}
