import { describe, it, expect } from "vitest";
import { RefreshTokenPrismaMapper } from "@infrastructure/mappers/refresh-token.prisma.mapper";
import { RefreshToken } from "@core/entities/refresh-token.entity";
import type { RefreshToken as PrismaRefreshToken } from "@generated/prisma/client";

describe("Refresh Token Prisma Mapper", () => {
    describe("toDomain()", () => {
        it("Should correctly map a raw Prisma refresh token to a domain RefreshToken entity.", () => {
            /**
             * Arrange
             */
            const mockRawPrismaToken: PrismaRefreshToken = {
                id: "rt-123",
                token: "hashed_refresh_token_string",
                userId: "user-456",
                deviceIp: "192.168.1.1",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                expiresAt: new Date("2026-03-17T12:00:00Z"),
                isRevoked: false,
                createdAt: new Date("2026-03-10T12:00:00Z"),
                updatedAt: new Date("2026-03-10T12:00:00Z"),
            };

            /**
             * Act
             */
            const domainToken =
                RefreshTokenPrismaMapper.toDomain(mockRawPrismaToken);

            /**
             * Assert
             */
            expect(domainToken).toBeInstanceOf(RefreshToken);

            expect(domainToken.id).toBe(mockRawPrismaToken.id);

            expect(domainToken.tokenHash).toBe(mockRawPrismaToken.token);

            expect(domainToken.userId).toBe(mockRawPrismaToken.userId);
            expect(domainToken.deviceIp).toBe(mockRawPrismaToken.deviceIp);
            expect(domainToken.userAgent).toBe(mockRawPrismaToken.userAgent);
            expect(domainToken.expiresAt).toBe(mockRawPrismaToken.expiresAt);
            expect(domainToken.isRevoked).toBe(mockRawPrismaToken.isRevoked);
            expect(domainToken.createdAt).toBe(mockRawPrismaToken.createdAt);
            expect(domainToken.updatedAt).toBe(mockRawPrismaToken.updatedAt);
        });
    });
});
