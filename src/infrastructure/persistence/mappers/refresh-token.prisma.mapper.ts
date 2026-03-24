import { RefreshToken } from "@core/domain/entities/refresh-token.entity";
import type { RefreshToken as PrismaRefreshToken } from "@generated/prisma/client";

export class RefreshTokenPrismaMapper {
    static toDomain(raw: PrismaRefreshToken): RefreshToken {
        return new RefreshToken({
            id: raw.id,
            tokenHash: raw.token,
            userId: raw.userId,
            deviceIp: raw.deviceIp,
            userAgent: raw.userAgent,
            expiresAt: raw.expiresAt,
            isRevoked: raw.isRevoked,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
}
