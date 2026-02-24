export class MockUserRepository {
    users = new Map();
    anonymousIndex = new Map();
    emailIndex = new Map();
    async createAnonymousUser(anonymousId) {
        const now = new Date();
        const user = {
            id: crypto.randomUUID(),
            anonymousId,
            email: null,
            plan: "free",
            subscriptionExpiresAt: null,
            createdAt: now,
            updatedAt: now,
        };
        this.users.set(user.id, user);
        this.anonymousIndex.set(anonymousId, user.id);
        return user;
    }
    async getUserById(id) {
        return this.users.get(id) ?? null;
    }
    async getUserByAnonymousId(anonymousId) {
        const id = this.anonymousIndex.get(anonymousId);
        if (!id)
            return null;
        return this.users.get(id) ?? null;
    }
    async getUserByEmail(email) {
        const id = this.emailIndex.get(email);
        if (!id)
            return null;
        return this.users.get(id) ?? null;
    }
    async updateSubscription(userId, plan, expiresAt) {
        const user = this.users.get(userId);
        if (!user)
            return null;
        const updated = {
            ...user,
            plan,
            subscriptionExpiresAt: expiresAt,
            updatedAt: new Date(),
        };
        this.users.set(userId, updated);
        return updated;
    }
    clear() {
        this.users.clear();
        this.anonymousIndex.clear();
        this.emailIndex.clear();
    }
    seed(users) {
        for (const user of users) {
            this.users.set(user.id, user);
            this.anonymousIndex.set(user.anonymousId, user.id);
            if (user.email) {
                this.emailIndex.set(user.email, user.id);
            }
        }
    }
}
