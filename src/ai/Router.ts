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
    const defaultProvider = process.env.DEFAULT_MODEL || "gemini";

    return this.providers[defaultProvider];
  }
}