import { NeonUserRepository } from "../../db/NeonUserRepository.js";
import { rateLimit } from "../../lib/rateLimit.js";
import { sendError } from "../../lib/errors.js";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const authRoutes = async (server) => {
    const userRepository = new NeonUserRepository();
    server.post("/register", {
        schema: {
            body: {
                type: "object",
                required: ["anonymousId"],
                properties: {
                    anonymousId: { type: "string" },
                },
                additionalProperties: false,
            },
        },
    }, async (request, reply) => {
        const { anonymousId } = request.body;
        if (!UUID_REGEX.test(anonymousId)) {
            return sendError(reply, 400, "INVALID_INPUT", "anonymousId must be a valid UUID");
        }
        if (!rateLimit(anonymousId, 5)) {
            return sendError(reply, 429, "RATE_LIMITED", "Too many registration attempts, try again later");
        }
        try {
            let user = await userRepository.getUserByAnonymousId(anonymousId);
            if (!user) {
                user = await userRepository.createAnonymousUser(anonymousId);
            }
            const token = server.jwt.sign({ userId: user.id });
            return {
                token,
                user: {
                    id: user.id,
                    isPro: user.plan === "pro",
                },
            };
        }
        catch (error) {
            server.log.error(error);
            return sendError(reply, 500, "INTERNAL_ERROR", "Failed to register user");
        }
    });
};
export default authRoutes;
