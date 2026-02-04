export interface ImageAttachment {
  base64: string              // Base64-encoded image data
  mimeType: string            // "image/png", "image/jpeg", "image/gif", "image/webp"
}

export interface AIRequest {
  input: string
  task: "mock_interview" | "feedback"
  locale: string
  userId: string
  image?: ImageAttachment     // Optional single image
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
  interviewId?: string
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