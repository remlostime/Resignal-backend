import type { FastifyPluginAsync } from "fastify"
import fjwt from "@fastify/jwt"

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string }
    user: { userId: string }
  }
}

const jwtPlugin: FastifyPluginAsync = async (server) => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required")
  }

  await server.register(fjwt, {
    secret,
    sign: {
      algorithm: "HS256",
      expiresIn: "30d",
    },
  })
}

export default jwtPlugin
