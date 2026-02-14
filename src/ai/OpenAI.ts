import { OpenAI } from "openai"
import type { ChatCompletionContentPart } from "openai/resources/chat/completions.js"
import type { AIProvider, AIRequest, AIResponse, ChatRequest, ChatResponse, QuestionCategory } from "./AIProvider.js"
import type { UserRepository } from "../db/UserRepository.js"
import type { InterviewRepository } from "../db/InterviewRepository.js"
import type { InterviewContextRepository } from "../db/InterviewContextRepository.js"
import type { InterviewMessageRepository } from "../db/InterviewMessageRepository.js"
import { buildPrompt, buildClassificationPrompt, buildChatPrompt } from "../prompt/prompt.js"
import { parseFeedbackResponse } from "./responseValidator.js"

const OPENAI_MODEL = "gpt-5.2"
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
                          lastError.message?.includes('Service Unavailable') ||
                          lastError.message?.includes('429') ||
                          lastError.message?.includes('Rate limit')
      
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

const VALID_CATEGORIES: QuestionCategory[] = ["global", "targeted", "specific"]
const DEFAULT_CATEGORY: QuestionCategory = "specific"

export class OpenAIProvider implements AIProvider {
  name = "openai"
  private client: OpenAI
  private userRepository?: UserRepository
  private interviewRepository?: InterviewRepository
  private contextRepository?: InterviewContextRepository
  private messageRepository?: InterviewMessageRepository

  constructor(
    userRepository?: UserRepository,
    interviewRepository?: InterviewRepository,
    contextRepository?: InterviewContextRepository,
    messageRepository?: InterviewMessageRepository
  ) {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })
    this.userRepository = userRepository
    this.interviewRepository = interviewRepository
    this.contextRepository = contextRepository
    this.messageRepository = messageRepository
  }

  async interview(req: AIRequest): Promise<AIResponse> {
    console.log(`[interview] Using model: openai (${OPENAI_MODEL})`)
    // Create interview record before calling AI
    let interviewId: string | undefined
    if (this.interviewRepository) {
      const interview = await this.interviewRepository.createInterview(req.userId, req.input)
      interviewId = interview.id
    }

    const prompt = buildPrompt(req)

    // Build content based on whether image is provided
    let content: string | ChatCompletionContentPart[]
    if (req.image) {
      // Multimodal content with text and image
      content = [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:${req.image.mimeType};base64,${req.image.base64}` } }
      ]
    } else {
      // Text-only content
      content = prompt
    }

    const completion = await withRetry(() =>
      this.client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content }],
      })
    )

    let text = completion.choices[0]?.message?.content ?? ""

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    const parsed = parseFeedbackResponse(JSON.parse(text))

    // Store AI response in context table
    if (this.contextRepository && interviewId) {
      await this.contextRepository.createContext(interviewId, parsed, OPENAI_MODEL)
    }

    return {
      output: parsed,
      interviewId
    }
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    console.log(`[chat] Using model: openai (${OPENAI_MODEL})`)
    console.log(`[chat] Received message for interview ${req.interviewId}: "${req.message}"`)

    // Store user message
    if (this.messageRepository) {
      await this.messageRepository.createMessage(req.interviewId, "user", req.message)
    }

    // Classify the question to determine context needs
    const category = await this.classify(req.message)
    console.log(`[chat] Question classified as "${category}" for: "${req.message}"`)

    // Fetch interview context (needed for all categories)
    const interviewContext = this.contextRepository
      ? await this.contextRepository.getContextByInterviewId(req.interviewId)
      : null
    console.log(`[chat] Interview context ${interviewContext ? "found" : "not found"} for interview ${req.interviewId}`)

    // For "specific" questions, also fetch the full transcript
    let transcript: string | undefined
    if (category === "specific" && this.interviewRepository) {
      const interview = await this.interviewRepository.getInterviewById(req.interviewId)
      transcript = interview?.transcript
      console.log(`[chat] Transcript ${transcript ? `loaded (${transcript.length} chars)` : "not found"} for specific question`)
    }

    // Build the enriched prompt with appropriate context
    let prompt: string
    if (interviewContext) {
      prompt = buildChatPrompt(req.message, interviewContext, transcript)
      console.log(`[chat] Built enriched prompt with context${transcript ? " + transcript" : ""} (${prompt.length} chars)`)
    } else {
      // Fallback: send raw message if no context is available
      prompt = req.message
      console.log(`[chat] No context available, using raw message as prompt`)
    }

    // Call AI with the context-enriched prompt
    const completion = await withRetry(() =>
      this.client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
      })
    )
    const reply = completion.choices[0]?.message?.content ?? ""
    console.log(`[chat] AI reply received (${reply.length} chars)`)

    // Store AI response
    let messageId: string | undefined
    if (this.messageRepository) {
      const aiMessage = await this.messageRepository.createMessage(req.interviewId, "ai", reply)
      messageId = aiMessage.id
    }

    return {
      reply,
      messageId
    }
  }

  async classify(message: string): Promise<QuestionCategory> {
    console.log(`[classify] Using model: openai (${OPENAI_MODEL})`)
    const prompt = buildClassificationPrompt(message)

    try {
      const completion = await this.client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
      })

      let text = completion.choices[0]?.message?.content ?? ""

      // Strip markdown code fences if present
      text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

      const parsed = JSON.parse(text)
      const category = parsed.category as string

      if (VALID_CATEGORIES.includes(category as QuestionCategory)) {
        return category as QuestionCategory
      }

      console.warn(`Invalid classification category "${category}", falling back to "${DEFAULT_CATEGORY}"`)
      return DEFAULT_CATEGORY
    } catch (error) {
      console.error("Question classification failed, falling back to default:", error)
      return DEFAULT_CATEGORY
    }
  }
}
