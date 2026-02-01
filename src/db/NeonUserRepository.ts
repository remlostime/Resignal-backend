import { neon } from "@neondatabase/serverless"
import type { UserRepository } from "./UserRepository.js"
import type { Plan, User } from "./types.js"

interface UserRow {
  id: string
  email: string
  plan: Plan
  created_at: string
}

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    plan: row.plan,
    createdAt: new Date(row.created_at)
  }
}

export class NeonUserRepository implements UserRepository {
  private sql

  constructor(databaseUrl?: string) {
    this.sql = neon(databaseUrl ?? process.env.DATABASE_URL!)
  }

  async createUser(email: string, plan: Plan = "free"): Promise<User | null> {
    const id = crypto.randomUUID()
    const createdAt = new Date()

    const rows = await this.sql`
      INSERT INTO users (id, email, plan, created_at)
      VALUES (${id}, ${email}, ${plan}, ${createdAt.toISOString()})
      ON CONFLICT DO NOTHING
      RETURNING id, email, plan, created_at;
    `

    if (rows.length === 0) {
      return null
    }

    return mapRowToUser(rows[0] as UserRow)
  }

  async getUserById(id: string): Promise<User | null> {
    const rows = await this.sql`
      SELECT id, email, plan, created_at
      FROM users
      WHERE id = ${id};
    `

    if (rows.length === 0) {
      return null
    }

    return mapRowToUser(rows[0] as UserRow)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const rows = await this.sql`
      SELECT id, email, plan, created_at
      FROM users
      WHERE email = ${email};
    `

    if (rows.length === 0) {
      return null
    }

    return mapRowToUser(rows[0] as UserRow)
  }
}
