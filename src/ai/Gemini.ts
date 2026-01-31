import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AIProvider, AIRequest, AIResponse, FeedbackResponse } from "./AIProvider.js"
import { buildPrompt } from "../prompt/interview.js"

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  initialDelay = INITIAL_DELAY_MS
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const isRetryable = lastError.message?.includes('503') || 
                          lastError.message?.includes('overloaded') ||
                          lastError.message?.includes('Service Unavailable')
      
      if (!isRetryable || attempt === maxRetries) {
        throw lastError
      }

      const delay = initialDelay * Math.pow(2, attempt) // 1s, 2s, 4s...
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
      await sleep(delay)
    }
  }

  throw lastError
}

export class GeminiProvider implements AIProvider {
  name = "gemini"
  private model

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" })
  }

  async chat(req: AIRequest): Promise<AIResponse> {
    const prompt = buildPrompt(req)

    const result = await withRetry(() => this.model.generateContent(prompt))
    let text = result.response.text()

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    const parsed: FeedbackResponse = JSON.parse(text)

    return {
      output: parsed
    }
  }
}
