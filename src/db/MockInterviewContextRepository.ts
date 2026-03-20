import type { InterviewContextRepository } from "./InterviewContextRepository.js"
import type { AIModel, InterviewContext } from "./types.js"

export class MockInterviewContextRepository implements InterviewContextRepository {
  private contexts = new Map<string, InterviewContext>()

  async createContext(interviewId: string, contextJson: any, model: AIModel): Promise<InterviewContext> {
    const context: InterviewContext = {
      interviewId,
      contextJson: JSON.parse(JSON.stringify(contextJson)), // Deep copy
      model,
      createdAt: new Date()
    }

    this.contexts.set(interviewId, context)

    return context
  }

  async getContextByInterviewId(interviewId: string): Promise<InterviewContext | null> {
    const context = this.contexts.get(interviewId)
    if (!context) {
      return null
    }

    // Return a deep copy to prevent mutations
    return {
      ...context,
      contextJson: JSON.parse(JSON.stringify(context.contextJson))
    }
  }

  async deleteByInterviewId(interviewId: string): Promise<void> {
    this.contexts.delete(interviewId)
  }

  // Helper method for testing - clears all data
  clear(): void {
    this.contexts.clear()
  }

  // Helper method for testing - seed with test data
  seed(contexts: InterviewContext[]): void {
    for (const context of contexts) {
      this.contexts.set(context.interviewId, {
        ...context,
        contextJson: JSON.parse(JSON.stringify(context.contextJson))
      })
    }
  }
}
