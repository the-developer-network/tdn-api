import { UnauthorizedError } from "@core/errors";
import { type FastifyRequest } from "fastify";
import { createHash } from "node:crypto";

/**
 * Authentication hook for Fastify requests.
 *
 * This hook checks the `Authorization` header in the incoming request and authenticates the user based on the provided token.
 *
 * - If the header starts with "Bot ", it treats the token as a bot token, hashes it, and looks up the corresponding user in the database.
 * - If the header starts with "Bearer ", it attempts to verify the JWT token.
 * - If authentication fails or the header is missing, it throws an `UnauthorizedError`.
 *
 * @param request - The Fastify request object.
 * @throws {UnauthorizedError} If authentication fails or the authorization header is missing.
 * @returns {Promise<void>} Resolves if authentication is successful.
 */
export async function authHook(request: FastifyRequest): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        throw new UnauthorizedError();
    }

    if (authHeader.startsWith("Bot ")) {
        const token = authHeader.replace("Bot ", "").trim();

        if (!token) throw new UnauthorizedError();

        const hashedToken = createHash("sha256").update(token).digest("hex");

        const botUser = await request.server.prisma.user.findFirst({
            where: { botToken: hashedToken, isBot: true },
        });

        if (!botUser) {
            throw new UnauthorizedError();
        }

        request.user = botUser;
        return;
    }

    if (authHeader.startsWith("Bearer ")) {
        try {
            await request.jwtVerify();
            return;
        } catch {
            throw new UnauthorizedError();
        }
    }

    throw new UnauthorizedError();
}
