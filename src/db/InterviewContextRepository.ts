import type { AIModel, InterviewContext } from "./types.js"

export interface InterviewContextRepository {
  createContext(interviewId: string, contextJson: any, model: AIModel): Promise<InterviewContext>
  getContextByInterviewId(interviewId: string): Promise<InterviewContext | null>
  deleteByInterviewId(interviewId: string): Promise<void>
}
