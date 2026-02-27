import type { FastifyPluginAsync } from "fastify"
import type { UserRepository } from "../../db/UserRepository.js"
import { NeonUserRepository } from "../../db/NeonUserRepository.js"
import { rateLimit } from "../../lib/rateLimit.js"
import { sendError } from "../../lib/errors.js"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const authRoutes: FastifyPluginAsync = async (server) => {
  const userRepository: UserRepository = new NeonUserRepository()

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
    const { anonymousId } = request.body as { anonymousId: string }

    if (!UUID_REGEX.test(anonymousId)) {
      return sendError(reply, 400, "INVALID_INPUT", "anonymousId must be a valid UUID")
    }

    const clientIp = request.headers["x-real-ip"] as string ?? request.ip
    if (!rateLimit(clientIp, 20)) {
      return sendError(reply, 429, "RATE_LIMITED", "Too many registration attempts, try again later")
    }

    if (!rateLimit(anonymousId, 5)) {
      return sendError(reply, 429, "RATE_LIMITED", "Too many registration attempts, try again later")
    }

    try {
      let user = await userRepository.getUserByAnonymousId(anonymousId)

      if (!user) {
        user = await userRepository.createAnonymousUser(anonymousId)
      }

      const token = server.jwt.sign({ userId: user.id })

      return {
        token,
        user: {
          id: user.id,
          plan: user.plan,
        },
      }
    } catch (error) {
      server.log.error(error)
      return sendError(reply, 500, "INTERNAL_ERROR", "Failed to register user")
    }
  })
}

export default authRoutes
