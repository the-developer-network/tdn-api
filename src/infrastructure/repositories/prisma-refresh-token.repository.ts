import type { PrismaClient } from "@generated/prisma/client";
import type { IRefreshTokenRepository } from "@core/repositories/refresh-token.repository";
import type { RefreshToken } from "@core/entities/refresh-token.entity";
import { RefreshTokenPrismaMapper } from "@infrastructure/mappers/refresh-token.prisma.mapper";
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(data: {
        token: string;
        userId: string;
        deviceIp: string;
        userAgent: string;
        expiresAt: Date;
    }): Promise<RefreshToken> {
        const rawToken = await this.prisma.refreshToken.create({
            data: {
                token: data.token,
                userId: data.userId,
                deviceIp: data.deviceIp,
                userAgent: data.userAgent,
                expiresAt: data.expiresAt,
            },
        });

        return RefreshTokenPrismaMapper.toDomain(rawToken);
    }

    async findByToken(token: string): Promise<RefreshToken | null> {
        const rawToken = await this.prisma.refreshToken.findUnique({
            where: { token },
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
}
