import type { RefreshToken } from "../../entities/refresh-token.entity";

export interface IRefreshTokenRepository {
    create(data: {
        tokenHash: string;
        userId: string;
        deviceIp: string;
        userAgent: string;
        expiresAt: Date;
    }): Promise<RefreshToken>;
    findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
    update(refreshToken: RefreshToken): Promise<void>;
    deleteExpiredTokens(): Promise<number>;
    revokeAllByUserId(userId: string): Promise<void>;
}
