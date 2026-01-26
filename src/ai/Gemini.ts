import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AIProvider, AIRequest, AIResponse } from "./AIProvider.js"
import { buildPrompt } from "../prompt/interview"

export class GeminiProvider implements AIProvider {
  name = "gemini"
  private model

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
  }

  async chat(req: AIRequest): Promise<AIResponse> {
    const prompt = buildPrompt(req)

    const result = await this.model.generateContent(prompt)
    const text = result.response.text()

    return {
      output: text
    }
  }
}