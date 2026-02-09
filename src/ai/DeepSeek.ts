import type { AIProvider, AIRequest, AIResponse, ChatRequest, ChatResponse, QuestionCategory } from "./AIProvider.js"

export class DeepSeekProvider implements AIProvider {
  name = "deepseek"

  async interview(req: AIRequest): Promise<AIResponse> {
    return {
      output: {
        title: "DeepSeek Placeholder Interview",
        summary: `DeepSeek placeholder for: ${req.input}`,
        strengths: [],
        improvement: [],
        hiring_signal: "N/A",
        key_observations: []
      }
    }
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    return {
      reply: `DeepSeek placeholder reply for: ${req.message}`
    }
  }

  async classify(message: string): Promise<QuestionCategory> {
    return "specific"
  }
}