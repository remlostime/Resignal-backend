import { AIProvider, AIRequest, AIResponse } from "./AIProvider"

export class DeepSeekProvider implements AIProvider {
  name = "deepseek"

  async chat(req: AIRequest): Promise<AIResponse> {
    return {
      output: `【DeepSeek】回答：${req.input}`
    }
  }
}