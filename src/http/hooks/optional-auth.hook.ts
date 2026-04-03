import { UnauthorizedError } from "@core/errors";
import { type FastifyRequest } from "fastify";

export async function optionalAuthHook(request: FastifyRequest): Promise<void> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return;

    try {
        await request.jwtVerify();
    } catch {
        throw new UnauthorizedError();
    }
}
