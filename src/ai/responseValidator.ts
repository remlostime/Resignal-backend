import { z } from "zod"
import type { FeedbackResponse } from "./AIProvider.js"

/**
 * Transform that handles both string and array inputs,
 * normalizing to string array format
 */
const stringOrArrayToArray = z.union([
  z.array(z.string()),
  z.string().transform(s => s.trim() ? [s] : []),
])

/**
 * Zod schema for validating and normalizing AI feedback responses.
 * Handles cases where the AI returns strings instead of arrays.
 */
const FeedbackResponseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  strengths: stringOrArrayToArray,
  improvement: stringOrArrayToArray,
  hiring_signal: z.string(),
  key_observations: stringOrArrayToArray,
})

/**
 * Parses and validates a raw AI response into a FeedbackResponse.
 * Normalizes fields that should be arrays but were returned as strings.
 * @param raw - The raw parsed JSON from the AI response
 * @returns A validated and normalized FeedbackResponse
 * @throws ZodError if the response doesn't match the expected schema
 */
export function parseFeedbackResponse(raw: unknown): FeedbackResponse {
  return FeedbackResponseSchema.parse(raw)
}
