import type { Plan, User } from "./types.js"

export interface UserRepository {
  createUser(email: string, plan?: Plan): Promise<User | null>
  createUserWithId(id: string, email: string, plan?: Plan): Promise<User | null>
  getUserById(id: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
}
