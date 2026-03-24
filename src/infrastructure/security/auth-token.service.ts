import type { FastifyInstance } from "fastify";
import { randomBytes, createHash } from "crypto";
import type {
    AuthTokenPort,
    RecoveryPayload,
    TokenResult,
    UserPayload,
} from "@core/ports/services/auth-token.port";

export class AuthTokenService implements AuthTokenPort {
    constructor(
        private readonly jwt: FastifyInstance["jwt"],
        private readonly expiresInSeconds: number,
        private readonly refreshTokenExpiresInSeconds: number,
    ) {}

    generate(payload: UserPayload): TokenResult {
        const accessToken = this.jwt.sign(payload);

        const nowInSeconds = Math.floor(Date.now() / 1000);
        const accessTokenExpiresAt = nowInSeconds + this.expiresInSeconds;

        const refreshToken = randomBytes(40).toString("hex");
        const refreshTokenExpiresAt = new Date(
            Date.now() + this.refreshTokenExpiresInSeconds * 1000,
        );

        return {
            accessToken,
            expiresAt: accessTokenExpiresAt,
            refreshToken,
            refreshTokenExpiresAt,
        };
    }
    verify(token: string): UserPayload {
        return this.jwt.verify(token);
    }

    hashRefreshSecret(secret: string): string {
        return createHash("sha256").update(secret).digest("hex");
    }

    generateRecoveryToken(userId: string): string {
        return this.jwt.sign({ sub: userId, purpose: "account_recovery" });
    }

    verifyRecoveryToken(token: string): RecoveryPayload {
        return this.jwt.verify(token);
    }
}
