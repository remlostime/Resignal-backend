import {} from 'fastify';
import { NeonUserRepository } from '../../db/NeonUserRepository.js';
const userRoutes = async (server) => {
    // Dependency Injection: default to NeonUserRepository
    const userRepository = new NeonUserRepository();
    server.post('/', async (request, reply) => {
        const { user_id, email, plan } = request.body;
        // Validate required fields
        if (!user_id || !email) {
            return reply.status(400).send({
                error: 'Missing required fields: user_id and email are required'
            });
        }
        // Default plan to "free" if not provided
        const userPlan = plan ?? 'free';
        try {
            const user = await userRepository.createUserWithId(user_id, email, userPlan);
            if (!user) {
                return reply.status(409).send({
                    error: 'User already exists with this email'
                });
            }
            return {
                success: true,
                user
            };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                error: 'Failed to create user'
            });
        }
    });
};
export default userRoutes;
