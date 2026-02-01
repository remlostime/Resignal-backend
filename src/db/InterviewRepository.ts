import type { Interview } from "./types.js"

export interface InterviewRepository {
  createInterview(userId: string, transcript: string): Promise<Interview>
  getInterviewById(id: string): Promise<Interview | null>
  getInterviewsByUserId(userId: string): Promise<Interview[]>
  deleteInterview(id: string): Promise<boolean>
}
