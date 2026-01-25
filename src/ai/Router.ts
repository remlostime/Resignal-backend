import { type AIProvider, type AIRequest } from "./AIProvider.js"
import { GeminiProvider } from "./Gemini.js"
import { DeepSeekProvider } from "./DeepSeek.js"

export class ModelRouter {
  private providers: Record<string, AIProvider>

  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      deepseek: new DeepSeekProvider()
    }
  }

  getProvider(task: AIRequest["task"]): AIProvider {
    // 👇 你以后改策略，只动这里
    if (task === "mock_interview") {
      return this.providers["gemini"]
    }

    return this.providers["deepseek"]
  }
}