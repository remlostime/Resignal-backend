import type { Interview, InterviewListItem, PaginatedResult } from "./types.js"

export interface InterviewRepository {
  createInterview(userId: string, transcript: string): Promise<Interview>
  getInterviewById(id: string): Promise<Interview | null>
  getInterviewsByUserId(userId: string): Promise<Interview[]>
  getPaginatedInterviewsByUserId(userId: string, page: number, pageSize: number): Promise<PaginatedResult<InterviewListItem>>
  deleteInterview(id: string): Promise<boolean>
}
