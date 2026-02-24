import fjwt from "@fastify/jwt";
const jwtPlugin = async (server) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is required");
    }
    await server.register(fjwt, {
        secret,
        sign: {
            algorithm: "HS256",
            expiresIn: "30d",
        },
    });
};
export default jwtPlugin;
