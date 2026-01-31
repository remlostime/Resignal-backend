import type { AIProvider, AIRequest, AIResponse } from "./AIProvider.js"

export class DeepSeekProvider implements AIProvider {
  name = "deepseek"

  async chat(req: AIRequest): Promise<AIResponse> {
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
}