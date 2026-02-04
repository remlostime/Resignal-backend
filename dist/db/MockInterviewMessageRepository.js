export class MockInterviewMessageRepository {
    messages = new Map();
    interviewIndex = new Map();
    async createMessage(interviewId, role, content) {
        const message = {
            id: crypto.randomUUID(),
            interviewId,
            role,
            content,
            createdAt: new Date()
        };
        this.messages.set(message.id, message);
        // Update interview index
        const interviewMessages = this.interviewIndex.get(interviewId) ?? new Set();
        interviewMessages.add(message.id);
        this.interviewIndex.set(interviewId, interviewMessages);
        return message;
    }
    async getMessageById(id) {
        return this.messages.get(id) ?? null;
    }
    async getMessagesByInterviewId(interviewId) {
        const messageIds = this.interviewIndex.get(interviewId);
        if (!messageIds) {
            return [];
        }
        const messages = [];
        for (const id of messageIds) {
            const message = this.messages.get(id);
            if (message) {
                messages.push(message);
            }
        }
        // Sort by createdAt ascending (chronological order)
        return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    // Helper method for testing - clears all data
    clear() {
        this.messages.clear();
        this.interviewIndex.clear();
    }
    // Helper method for testing - seed with test data
    seed(messages) {
        for (const message of messages) {
            this.messages.set(message.id, message);
            const interviewMessages = this.interviewIndex.get(message.interviewId) ?? new Set();
            interviewMessages.add(message.id);
            this.interviewIndex.set(message.interviewId, interviewMessages);
        }
    }
}
