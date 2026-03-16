import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify"
import type { UserRepository } from "../db/UserRepository.js"
import type { User } from "../db/types.js"
import { sendError } from "../lib/errors.js"

declare module "fastify" {
  interface FastifyRequest {
    authenticatedUser: User
  }
}

export function buildAuthMiddleware(userRepository: UserRepository) {
  const authenticate: preHandlerHookHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const payload = await request.jwtVerify<{ userId: string }>()
      const user = await userRepository.getUserById(payload.userId)

      if (!user) {
        return sendError(reply, 401, "USER_NOT_FOUND", "User associated with token no longer exists")
      }

      request.authenticatedUser = user
    } catch {
      return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token")
    }
  }

  const requireProUser: preHandlerHookHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const user = request.authenticatedUser
    if (!user) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required")
    }

    const isSubscriptionActive =
      user.plan === "pro" &&
      user.subscriptionExpiresAt !== null &&
      user.subscriptionExpiresAt > new Date()

    if (!isSubscriptionActive) {
      return sendError(reply, 403, "PRO_REQUIRED", "Active Pro subscription required")
    }
  }

  return { authenticate, requireProUser }
}
