import type { UserRepository } from "./UserRepository.js"
import type { Plan, User } from "./types.js"

export class MockUserRepository implements UserRepository {
  private users = new Map<string, User>()
  private anonymousIndex = new Map<string, string>()
  private emailIndex = new Map<string, string>()

  async createAnonymousUser(anonymousId: string): Promise<User> {
    const now = new Date()
    const user: User = {
      id: crypto.randomUUID(),
      anonymousId,
      email: null,
      plan: "free",
      subscriptionExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    }

    this.users.set(user.id, user)
    this.anonymousIndex.set(anonymousId, user.id)

    return user
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async getUserByAnonymousId(anonymousId: string): Promise<User | null> {
    const id = this.anonymousIndex.get(anonymousId)
    if (!id) return null
    return this.users.get(id) ?? null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const id = this.emailIndex.get(email)
    if (!id) return null
    return this.users.get(id) ?? null
  }

  async updateSubscription(userId: string, plan: Plan, expiresAt: Date): Promise<User | null> {
    const user = this.users.get(userId)
    if (!user) return null

    const updated: User = {
      ...user,
      plan,
      subscriptionExpiresAt: expiresAt,
      updatedAt: new Date(),
    }

    this.users.set(userId, updated)
    return updated
  }

  clear(): void {
    this.users.clear()
    this.anonymousIndex.clear()
    this.emailIndex.clear()
  }

  seed(users: User[]): void {
    for (const user of users) {
      this.users.set(user.id, user)
      this.anonymousIndex.set(user.anonymousId, user.id)
      if (user.email) {
        this.emailIndex.set(user.email, user.id)
      }
    }
  }
}
