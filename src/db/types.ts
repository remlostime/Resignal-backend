export type Plan = "free" | "pro"

export type Role = "user" | "ai"

export type AIModel = "gemini-3-flash-preview" | "deepseek-chat" | "gpt-5.2"

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

export type TranscriptionJobStatus = "pending" | "processing" | "completed" | "failed"

export interface TranscriptionJob {
  id: string
  userId: string
  status: TranscriptionJobStatus
  transcript: string | null
  segments: unknown | null
  duration: number | null
  totalChunks: number
  completedChunks: number
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TranscriptionChunk {
  id: string
  jobId: string
  chunkIndex: number
  blobUrl: string
  status: TranscriptionJobStatus
  transcript: string | null
  segments: unknown | null
  duration: number | null
  errorMessage: string | null
  createdAt: Date
}
