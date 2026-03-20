import type { InterviewMessage, Role } from "./types.js"

export interface InterviewMessageRepository {
  createMessage(interviewId: string, role: Role, content: string): Promise<InterviewMessage>
  getMessageById(id: string): Promise<InterviewMessage | null>
  getMessagesByInterviewId(interviewId: string): Promise<InterviewMessage[]>
  deleteByInterviewId(interviewId: string): Promise<void>
}
