export class MockInterviewRepository {
    interviews = new Map();
    userIndex = new Map();
    contextData = new Map();
    async createInterview(userId, transcript) {
        const interview = {
            id: crypto.randomUUID(),
            userId,
            transcript,
            createdAt: new Date()
        };
        this.interviews.set(interview.id, interview);
        // Update user index
        const userInterviews = this.userIndex.get(userId) ?? new Set();
        userInterviews.add(interview.id);
        this.userIndex.set(userId, userInterviews);
        return interview;
    }
    async getInterviewById(id) {
        return this.interviews.get(id) ?? null;
    }
    async getInterviewsByUserId(userId) {
        const interviewIds = this.userIndex.get(userId);
        if (!interviewIds) {
            return [];
        }
        const interviews = [];
        for (const id of interviewIds) {
            const interview = this.interviews.get(id);
            if (interview) {
                interviews.push(interview);
            }
        }
        // Sort by createdAt descending
        return interviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async getPaginatedInterviewsByUserId(userId, page, pageSize) {
        const allInterviews = await this.getInterviewsByUserId(userId);
        const total = allInterviews.length;
        const offset = (page - 1) * pageSize;
        const paged = allInterviews.slice(offset, offset + pageSize);
        return {
            items: paged.map(interview => {
                const context = this.contextData.get(interview.id);
                return {
                    id: interview.id,
                    title: context?.title ?? null,
                    summary: context?.summary ?? null,
                    createdAt: interview.createdAt
                };
            }),
            total
        };
    }
    async deleteInterview(id) {
        const interview = this.interviews.get(id);
        if (!interview) {
            return false;
        }
        this.interviews.delete(id);
        // Update user index
        const userInterviews = this.userIndex.get(interview.userId);
        if (userInterviews) {
            userInterviews.delete(id);
        }
        return true;
    }
    // Helper method for testing - clears all data
    clear() {
        this.interviews.clear();
        this.userIndex.clear();
        this.contextData.clear();
    }
    // Helper method for testing - seed with test data
    seed(interviews) {
        for (const interview of interviews) {
            this.interviews.set(interview.id, interview);
            const userInterviews = this.userIndex.get(interview.userId) ?? new Set();
            userInterviews.add(interview.id);
            this.userIndex.set(interview.userId, userInterviews);
        }
    }
    seedContextData(data) {
        for (const [id, context] of data) {
            this.contextData.set(id, context);
        }
    }
}
