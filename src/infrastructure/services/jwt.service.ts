import type { UserPayload } from "@core/interfaces/user-payload.interface";
import type { TokenPort, TokenResult } from "@core/ports/token.port";
import type { FastifyInstance } from "fastify";

export class JwtService implements TokenPort {
    constructor(
        private readonly fastify: FastifyInstance,
        private readonly expiresInSeconds: number,
    ) {}

    generate(payload: UserPayload): TokenResult {
        const accessToken = this.fastify.jwt.sign(payload);

        const nowInSeconds = Math.floor(Date.now() / 1000);
        const expiresAt = nowInSeconds + this.expiresInSeconds;

        return {
            accessToken,
            expiresAt,
        };
    }
    verify(token: string): UserPayload {
        return this.fastify.jwt.verify(token);
    }
}
