import { type AIProvider } from "./AIProvider.js"
import { GeminiProvider } from "./Gemini.js"
import { DeepSeekProvider } from "./DeepSeek.js"
import { OpenAIProvider } from "./OpenAI.js"
import { NeonInterviewRepository } from "../db/NeonInterviewRepository.js"
import { NeonInterviewContextRepository } from "../db/NeonInterviewContextRepository.js"
import { NeonInterviewMessageRepository } from "../db/NeonInterviewMessageRepository.js"

export type ModelKey = "gemini" | "deepseek" | "openai"

export const VALID_MODELS: ModelKey[] = ["gemini", "deepseek", "openai"]

export class ModelRouter {
  private providers: Partial<Record<ModelKey, AIProvider>> = {}

  getProvider(model?: string): AIProvider {
    const key = (model && VALID_MODELS.includes(model as ModelKey))
      ? model as ModelKey
      : (process.env.DEFAULT_MODEL || "gemini") as ModelKey;

    if (!this.providers[key]) {
      this.providers[key] = this.createProvider(key)
    }

    return this.providers[key]!
  }

  private createProvider(key: ModelKey): AIProvider {
    const interviewRepository = new NeonInterviewRepository()
    const contextRepository = new NeonInterviewContextRepository()
    const messageRepository = new NeonInterviewMessageRepository()

    switch (key) {
      case "gemini":
        return new GeminiProvider(undefined, interviewRepository, contextRepository, messageRepository)
      case "deepseek":
        return new DeepSeekProvider(undefined, interviewRepository, contextRepository, messageRepository)
      case "openai":
        return new OpenAIProvider(undefined, interviewRepository, contextRepository, messageRepository)
      default:
        throw new Error(`Unknown model provider: ${key}`)
    }
  }
}