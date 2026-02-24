import type { FastifyReply } from "fastify"

export class AppError extends Error {
  readonly code: string
  readonly statusCode: number

  constructor(code: string, message: string, statusCode: number) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.statusCode = statusCode
  }
}

export function sendError(reply: FastifyReply, statusCode: number, code: string, message: string) {
  return reply.status(statusCode).send({
    error: { code, message },
  })
}

export function sendAppError(reply: FastifyReply, err: AppError) {
  return sendError(reply, err.statusCode, err.code, err.message)
}
