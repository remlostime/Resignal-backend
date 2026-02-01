export interface AIRequest {
  input: string
  task: "mock_interview" | "feedback"
  locale: string
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

export interface AIProvider {
  name: string
  interview(req: AIRequest): Promise<AIResponse>
}