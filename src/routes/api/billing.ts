import type { FastifyPluginAsync } from "fastify"
import type { UserRepository } from "../../db/UserRepository.js"
import { NeonUserRepository } from "../../db/NeonUserRepository.js"
import type { AppleTransactionVerifier } from "../../services/AppleReceiptService.js"
import { AppleReceiptService } from "../../services/AppleReceiptService.js"
import { buildAuthMiddleware } from "../../middleware/auth.js"
import { rateLimit } from "../../lib/rateLimit.js"
import { sendError } from "../../lib/errors.js"

const billingRoutes: FastifyPluginAsync = async (server) => {
  const userRepository: UserRepository = new NeonUserRepository()
  const { authenticate } = buildAuthMiddleware(userRepository)

  let transactionVerifier: AppleTransactionVerifier | null = null
  function getVerifier(): AppleTransactionVerifier {
    if (!transactionVerifier) {
      transactionVerifier = new AppleReceiptService()
    }
    return transactionVerifier
  }

  server.post("/verify", {
    preHandler: [authenticate],
    schema: {
      body: {
        type: "object",
        required: ["signedTransaction"],
        properties: {
          signedTransaction: { type: "string", minLength: 1 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const user = request.authenticatedUser

    if (!rateLimit(user.id, 10)) {
      return sendError(reply, 429, "RATE_LIMITED", "Too many verification attempts, try again later")
    }

    const { signedTransaction } = request.body as { signedTransaction: string }

    try {
      const result = await getVerifier().verifyTransaction(signedTransaction)

      if (!result.isValid || !result.expiresAt) {
        return sendError(reply, 400, "INVALID_RECEIPT", "Transaction is invalid or subscription has expired")
      }

      const updated = await userRepository.updateSubscription(user.id, "pro", result.expiresAt)

      if (!updated) {
        return sendError(reply, 500, "UPDATE_FAILED", "Failed to update subscription status")
      }

      return {
        isPro: true,
        expiresAt: result.expiresAt.toISOString(),
      }
    } catch (error) {
      server.log.error(error)
      return sendError(reply, 500, "INTERNAL_ERROR", "Failed to verify transaction")
    }
  })
}

export default billingRoutes
