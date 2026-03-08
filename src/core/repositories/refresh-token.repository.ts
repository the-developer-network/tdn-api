import type { RefreshToken } from "../entities/refresh-token.entity";

export interface IRefreshTokenRepository {
    create(data: {
        token: string;
        userId: string;
        deviceIp: string;
        userAgent: string;
        expiresAt: Date;
    }): Promise<RefreshToken>;
    findByToken(token: string): Promise<RefreshToken | null>;
    update(refreshToken: RefreshToken): Promise<void>;
    deleteInvalidBefore(date: Date): Promise<number>;
}
