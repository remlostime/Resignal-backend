import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "../prompt/prompt.js";
import { parseFeedbackResponse } from "./responseValidator.js";
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function withRetry(fn, maxRetries = MAX_RETRIES, initialDelay = INITIAL_DELAY_MS) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            const isRetryable = lastError.message?.includes('503') ||
                lastError.message?.includes('overloaded') ||
                lastError.message?.includes('Service Unavailable');
            if (!isRetryable || attempt === maxRetries) {
                throw lastError;
            }
            const delay = initialDelay * Math.pow(2, attempt); // 1s, 2s, 4s...
            console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
            await sleep(delay);
        }
    }
    throw lastError;
}
export class GeminiProvider {
    name = "gemini";
    model;
    userRepository;
    interviewRepository;
    contextRepository;
    messageRepository;
    constructor(userRepository, interviewRepository, contextRepository, messageRepository) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        this.userRepository = userRepository;
        this.interviewRepository = interviewRepository;
        this.contextRepository = contextRepository;
        this.messageRepository = messageRepository;
    }
    async interview(req) {
        // Create interview record before calling AI
        let interviewId;
        if (this.interviewRepository) {
            const interview = await this.interviewRepository.createInterview(req.userId, req.input);
            interviewId = interview.id;
        }
        const prompt = buildPrompt(req);
        // Build content based on whether image is provided
        let result;
        if (req.image) {
            // Multimodal content with text and image
            result = await withRetry(() => this.model.generateContent([
                { text: prompt },
                { inlineData: { mimeType: req.image.mimeType, data: req.image.base64 } }
            ]));
        }
        else {
            // Text-only content
            result = await withRetry(() => this.model.generateContent(prompt));
        }
        let text = result.response.text();
        // Strip markdown code fences if present
        text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        const parsed = parseFeedbackResponse(JSON.parse(text));
        // Store AI response in context table
        if (this.contextRepository && interviewId) {
            await this.contextRepository.createContext(interviewId, parsed, "gemini-3-flash-preview");
        }
        return {
            output: parsed,
            interviewId
        };
    }
    async chat(req) {
        // Store user message
        if (this.messageRepository) {
            await this.messageRepository.createMessage(req.interviewId, "user", req.message);
        }
        // Call AI with the message
        const result = await withRetry(() => this.model.generateContent(req.message));
        const reply = result.response.text();
        // Store AI response
        let messageId;
        if (this.messageRepository) {
            const aiMessage = await this.messageRepository.createMessage(req.interviewId, "ai", reply);
            messageId = aiMessage.id;
        }
        return {
            reply,
            messageId
        };
    }
}
