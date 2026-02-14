import { type AIProvider, type AIRequest } from "./AIProvider.js"
import { GeminiProvider } from "./Gemini.js"
import { DeepSeekProvider } from "./DeepSeek.js"
import { OpenAIProvider } from "./OpenAI.js"
import { NeonInterviewRepository } from "../db/NeonInterviewRepository.js"
import { NeonInterviewContextRepository } from "../db/NeonInterviewContextRepository.js"
import { NeonInterviewMessageRepository } from "../db/NeonInterviewMessageRepository.js"

export type ModelKey = "gemini" | "deepseek" | "openai"

export const VALID_MODELS: ModelKey[] = ["gemini", "deepseek", "openai"]

export class ModelRouter {
  private providers: Record<ModelKey, AIProvider>

  constructor() {
    const interviewRepository = new NeonInterviewRepository()
    const contextRepository = new NeonInterviewContextRepository()
    const messageRepository = new NeonInterviewMessageRepository()
    
    this.providers = {
      gemini: new GeminiProvider(undefined, interviewRepository, contextRepository, messageRepository),
      deepseek: new DeepSeekProvider(undefined, interviewRepository, contextRepository, messageRepository),
      openai: new OpenAIProvider(undefined, interviewRepository, contextRepository, messageRepository)
    }
  }

  getProvider(model?: string): AIProvider {
    const key = (model && VALID_MODELS.includes(model as ModelKey))
      ? model as ModelKey
      : (process.env.DEFAULT_MODEL || "gemini") as ModelKey;

    const provider = this.providers[key];
    if (!provider) {
      throw new Error(`Unknown model provider: ${key}`);
    }
    return provider;
  }
}