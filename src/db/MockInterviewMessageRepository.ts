import type { InterviewMessageRepository } from "./InterviewMessageRepository.js"
import type { InterviewMessage, Role } from "./types.js"

export class MockInterviewMessageRepository implements InterviewMessageRepository {
  private messages = new Map<string, InterviewMessage>()
  private interviewIndex = new Map<string, Set<string>>()

  async createMessage(interviewId: string, role: Role, content: string): Promise<InterviewMessage> {
    const message: InterviewMessage = {
      id: crypto.randomUUID(),
      interviewId,
      role,
      content,
      createdAt: new Date()
    }

    this.messages.set(message.id, message)

    // Update interview index
    const interviewMessages = this.interviewIndex.get(interviewId) ?? new Set()
    interviewMessages.add(message.id)
    this.interviewIndex.set(interviewId, interviewMessages)

    return message
  }

  async getMessageById(id: string): Promise<InterviewMessage | null> {
    return this.messages.get(id) ?? null
  }

  async getMessagesByInterviewId(interviewId: string): Promise<InterviewMessage[]> {
    const messageIds = this.interviewIndex.get(interviewId)
    if (!messageIds) {
      return []
    }

    const messages: InterviewMessage[] = []
    for (const id of messageIds) {
      const message = this.messages.get(id)
      if (message) {
        messages.push(message)
      }
    }

    // Sort by createdAt ascending (chronological order)
    return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async deleteByInterviewId(interviewId: string): Promise<void> {
    const messageIds = this.interviewIndex.get(interviewId)
    if (messageIds) {
      for (const id of messageIds) {
        this.messages.delete(id)
      }
      this.interviewIndex.delete(interviewId)
    }
  }

  // Helper method for testing - clears all data
  clear(): void {
    this.messages.clear()
    this.interviewIndex.clear()
  }

  // Helper method for testing - seed with test data
  seed(messages: InterviewMessage[]): void {
    for (const message of messages) {
      this.messages.set(message.id, message)
      const interviewMessages = this.interviewIndex.get(message.interviewId) ?? new Set()
      interviewMessages.add(message.id)
      this.interviewIndex.set(message.interviewId, interviewMessages)
    }
  }
}
