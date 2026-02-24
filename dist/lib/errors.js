export class AppError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.statusCode = statusCode;
    }
}
export function sendError(reply, statusCode, code, message) {
    return reply.status(statusCode).send({
        error: { code, message },
    });
}
export function sendAppError(reply, err) {
    return sendError(reply, err.statusCode, err.code, err.message);
}
