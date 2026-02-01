export type Plan = "free" | "pro"

export type Role = "user" | "ai"

export type AIModel = "gemini-3-flash-preview"

export interface User {
  id: string
  email: string
  plan: Plan
  createdAt: Date
}

export interface Interview {
  id: string
  userId: string
  transcript: string
  createdAt: Date
}

export interface InterviewMessage {
  id: string
  interviewId: string
  role: Role
  content: string
  createdAt: Date
}

export interface InterviewContext {
  interviewId: string
  contextJson: any
  model: AIModel
  createdAt: Date
}
