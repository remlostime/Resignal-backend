export class MockUserRepository {
    users = new Map();
    emailIndex = new Map();
    async createUser(email, plan = "free") {
        if (this.emailIndex.has(email)) {
            return null;
        }
        const user = {
            id: crypto.randomUUID(),
            email,
            plan,
            createdAt: new Date()
        };
        this.users.set(user.id, user);
        this.emailIndex.set(email, user.id);
        return user;
    }
    async createUserWithId(id, email, plan = "free") {
        if (this.emailIndex.has(email)) {
            return null;
        }
        const user = {
            id,
            email,
            plan,
            createdAt: new Date()
        };
        this.users.set(user.id, user);
        this.emailIndex.set(email, user.id);
        return user;
    }
    async getUserById(id) {
        return this.users.get(id) ?? null;
    }
    async getUserByEmail(email) {
        const id = this.emailIndex.get(email);
        if (!id) {
            return null;
        }
        return this.users.get(id) ?? null;
    }
    // Helper method for testing - clears all data
    clear() {
        this.users.clear();
        this.emailIndex.clear();
    }
    // Helper method for testing - seed with test data
    seed(users) {
        for (const user of users) {
            this.users.set(user.id, user);
            this.emailIndex.set(user.email, user.id);
        }
    }
}
