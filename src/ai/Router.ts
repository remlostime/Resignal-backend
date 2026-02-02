import { type AIProvider, type AIRequest } from "./AIProvider.js"
import { GeminiProvider } from "./Gemini.js"
import { DeepSeekProvider } from "./DeepSeek.js"
import { NeonInterviewRepository } from "../db/NeonInterviewRepository.js"
import { NeonInterviewContextRepository } from "../db/NeonInterviewContextRepository.js"

export class ModelRouter {
  private providers: Record<string, AIProvider>

  constructor() {
    const interviewRepository = new NeonInterviewRepository()
    const contextRepository = new NeonInterviewContextRepository()
    
    this.providers = {
      gemini: new GeminiProvider(undefined, interviewRepository, contextRepository),
      deepseek: new DeepSeekProvider()
    }
  }

  getProvider(task: AIRequest["task"]): AIProvider {
    const defaultProvider = process.env.DEFAULT_MODEL || "gemini";

    return this.providers[defaultProvider];
  }
}