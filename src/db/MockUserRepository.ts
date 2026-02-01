import type { UserRepository } from "./UserRepository.js"
import type { Plan, User } from "./types.js"

export class MockUserRepository implements UserRepository {
  private users = new Map<string, User>()
  private emailIndex = new Map<string, string>()

  async createUser(email: string, plan: Plan = "free"): Promise<User | null> {
    if (this.emailIndex.has(email)) {
      return null
    }

    const user: User = {
      id: crypto.randomUUID(),
      email,
      plan,
      createdAt: new Date()
    }

    this.users.set(user.id, user)
    this.emailIndex.set(email, user.id)

    return user
  }

  async createUserWithId(id: string, email: string, plan: Plan = "free"): Promise<User | null> {
    if (this.emailIndex.has(email)) {
      return null
    }

    const user: User = {
      id,
      email,
      plan,
      createdAt: new Date()
    }

    this.users.set(user.id, user)
    this.emailIndex.set(email, user.id)

    return user
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const id = this.emailIndex.get(email)
    if (!id) {
      return null
    }
    return this.users.get(id) ?? null
  }

  // Helper method for testing - clears all data
  clear(): void {
    this.users.clear()
    this.emailIndex.clear()
  }

  // Helper method for testing - seed with test data
  seed(users: User[]): void {
    for (const user of users) {
      this.users.set(user.id, user)
      this.emailIndex.set(user.email, user.id)
    }
  }
}
