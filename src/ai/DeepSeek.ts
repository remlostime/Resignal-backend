import type { AIProvider, AIRequest, AIResponse } from "./AIProvider.js"

export class DeepSeekProvider implements AIProvider {
  name = "deepseek"

  async chat(req: AIRequest): Promise<AIResponse> {
    return {
      output: `【DeepSeek】回答：${req.input}`
    }
  }
}