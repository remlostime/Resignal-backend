export interface AIRequest {
  input: string
  task: "mock_interview" | "feedback"
  locale: string
  userId: string
}

export interface FeedbackResponse {
  title: string
  summary: string
  strengths: string[]
  improvement: string[]
  hiring_signal: string
  key_observations: string[]
}

export interface AIResponse {
  output: FeedbackResponse
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
}

export interface ChatRequest {
  interviewId: string
  message: string
  userId: string
}

export interface ChatResponse {
  reply: string
  messageId?: string
}

export interface AIProvider {
  name: string
  interview(req: AIRequest): Promise<AIResponse>
  chat(req: ChatRequest): Promise<ChatResponse>
}