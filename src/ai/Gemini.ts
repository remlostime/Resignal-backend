import { AIProvider, AIRequest, AIResponse } from "./AIProvider"

export class GeminiProvider implements AIProvider {
  name = "gemini"

  async chat(req: AIRequest): Promise<AIResponse> {
    // 这里先 mock，后面你接官方 SDK
    return {
      output: `【Gemini】回答：${req.input}`
    }
  }
}