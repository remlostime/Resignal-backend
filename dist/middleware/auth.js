import { sendError } from "../lib/errors.js";
export function buildAuthMiddleware(userRepository) {
    const authenticate = async (request, reply) => {
        try {
            const payload = await request.jwtVerify();
            const user = await userRepository.getUserById(payload.userId);
            if (!user) {
                return sendError(reply, 401, "USER_NOT_FOUND", "User associated with token no longer exists");
            }
            request.authenticatedUser = user;
        }
        catch {
            return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token");
        }
    };
    const requireProUser = async (request, reply) => {
        const user = request.authenticatedUser;
        if (!user) {
            return sendError(reply, 401, "UNAUTHORIZED", "Authentication required");
        }
        const isSubscriptionActive = user.plan === "pro" &&
            user.subscriptionExpiresAt !== null &&
            user.subscriptionExpiresAt > new Date();
        if (!isSubscriptionActive) {
            return sendError(reply, 403, "PRO_REQUIRED", "Active Pro subscription required");
        }
    };
    return { authenticate, requireProUser };
}
