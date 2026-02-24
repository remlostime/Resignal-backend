import type { Plan, User } from "./types.js"

export interface UserRepository {
  createAnonymousUser(anonymousId: string): Promise<User>
  getUserById(id: string): Promise<User | null>
  getUserByAnonymousId(anonymousId: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  updateSubscription(userId: string, plan: Plan, expiresAt: Date): Promise<User | null>
}
