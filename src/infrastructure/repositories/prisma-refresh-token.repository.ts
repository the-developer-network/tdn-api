import type { IRefreshTokenRepository } from "@core/repositories/refresh-token.repository";
import type { RefreshToken } from "@core/entities/refresh-token.entity";
import { RefreshTokenPrismaMapper } from "@infrastructure/mappers/refresh-token.prisma.mapper";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    async create(data: {
        tokenHash: string;
        userId: string;
        deviceIp: string;
        userAgent: string;
        expiresAt: Date;
    }): Promise<RefreshToken> {
        const rawToken = await this.prisma.refreshToken.create({
            data: {
                token: data.tokenHash,
                userId: data.userId,
                deviceIp: data.deviceIp,
                userAgent: data.userAgent,
                expiresAt: data.expiresAt,
            },
        });

        return RefreshTokenPrismaMapper.toDomain(rawToken);
    }

    async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
        const rawToken = await this.prisma.refreshToken.findUnique({
            where: { token: tokenHash },
        });

        if (!rawToken) return null;

        return RefreshTokenPrismaMapper.toDomain(rawToken);
    }

    async update(refreshToken: RefreshToken): Promise<void> {
        await this.prisma.refreshToken.update({
            where: { id: refreshToken.id },
            data: {
                isRevoked: refreshToken.isRevoked,
                updatedAt: new Date(),
            },
        });
    }

    async deleteInvalidBefore(date: Date): Promise<number> {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    {
                        isRevoked: true,
                        updatedAt: {
                            lt: date,
                        },
                    },
                    {
                        expiresAt: {
                            lt: date,
                        },
                    },
                ],
            },
        });

        return result.count;
    }

    async revokeAllByUserId(userId: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
                updatedAt: new Date(),
            },
        });
    }
}
