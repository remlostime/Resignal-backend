import { neon } from '@neondatabase/serverless';
import { NeonUserRepository } from '../db/NeonUserRepository.js';
import { NeonInterviewRepository } from '../db/NeonInterviewRepository.js';
import { NeonInterviewMessageRepository } from '../db/NeonInterviewMessageRepository.js';
import { NeonInterviewContextRepository } from '../db/NeonInterviewContextRepository.js';
const neonPlugin = async (server) => {
    // 取连接串（本地用 .env.local，Vercel 自动注入）
    const sql = neon(process.env.DATABASE_URL);
    const userRepository = new NeonUserRepository();
    const interviewRepository = new NeonInterviewRepository();
    const messageRepository = new NeonInterviewMessageRepository();
    const contextRepository = new NeonInterviewContextRepository();
    server.get('/health', async () => {
        const [result] = await sql `SELECT now() as t;`;
        return { db: 'up', neonNow: result.t };
    });
    server.post('/user', async (_request, reply) => {
        const randomEmail = `user-${Date.now()}@example.com`;
        const user = await userRepository.createUser(randomEmail);
        if (!user) {
            return reply.status(409).send({ message: 'already exists' });
        }
        return user;
    });
    server.post('/interview', async () => {
        // Create a user first, then create interview for that user
        const user = await userRepository.createUser(`user-${Date.now()}@example.com`);
        const transcript = `Sample interview transcript at ${new Date().toISOString()}`;
        return await interviewRepository.createInterview(user.id, transcript);
    });
    server.post('/message', async () => {
        // Create a user, then interview, then message
        const user = await userRepository.createUser(`user-${Date.now()}@example.com`);
        const transcript = `Sample interview transcript at ${new Date().toISOString()}`;
        const interview = await interviewRepository.createInterview(user.id, transcript);
        const role = Math.random() > 0.5 ? 'user' : 'ai';
        const content = `${role === 'user' ? 'User' : 'AI'} message at ${new Date().toISOString()}`;
        return await messageRepository.createMessage(interview.id, role, content);
    });
    server.post('/context', async () => {
        // Create a user, then interview, then context
        const user = await userRepository.createUser(`user-${Date.now()}@example.com`);
        const transcript = `Sample interview transcript at ${new Date().toISOString()}`;
        const interview = await interviewRepository.createInterview(user.id, transcript);
        const contextJson = {
            question: "Tell me about yourself",
            history: [],
            metadata: {
                timestamp: new Date().toISOString(),
                sessionId: crypto.randomUUID()
            }
        };
        return await contextRepository.createContext(interview.id, contextJson, 'gemini-3-flash-preview');
    });
};
export default neonPlugin;
