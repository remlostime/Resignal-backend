export class MockInterviewContextRepository {
    contexts = new Map();
    async createContext(interviewId, contextJson, model) {
        const context = {
            interviewId,
            contextJson: JSON.parse(JSON.stringify(contextJson)), // Deep copy
            model,
            createdAt: new Date()
        };
        this.contexts.set(interviewId, context);
        return context;
    }
    async getContextByInterviewId(interviewId) {
        const context = this.contexts.get(interviewId);
        if (!context) {
            return null;
        }
        // Return a deep copy to prevent mutations
        return {
            ...context,
            contextJson: JSON.parse(JSON.stringify(context.contextJson))
        };
    }
    // Helper method for testing - clears all data
    clear() {
        this.contexts.clear();
    }
    // Helper method for testing - seed with test data
    seed(contexts) {
        for (const context of contexts) {
            this.contexts.set(context.interviewId, {
                ...context,
                contextJson: JSON.parse(JSON.stringify(context.contextJson))
            });
        }
    }
}
