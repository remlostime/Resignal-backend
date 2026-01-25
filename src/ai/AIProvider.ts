export interface AIRequest {
    input: string
    task: "mock_interview" | "feedback"
    locale: string
  }
  
  export interface AIResponse {
    output: string
    usage?: {
      inputTokens?: number
      outputTokens?: number
    }
  }
  
  export interface AIProvider {
    name: string
    chat(req: AIRequest): Promise<AIResponse>
  }