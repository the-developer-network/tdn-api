import { UnauthorizedError } from "@core/errors";
import { type FastifyRequest } from "fastify";

export async function authHook(request: FastifyRequest): Promise<void> {
    try {
        await request.jwtVerify();
    } catch {
        throw new UnauthorizedError();
    }
}
