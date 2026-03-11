import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import { PrismaRefreshTokenRepository } from "@infrastructure/repositories/prisma-refresh-token.repository";
import { RefreshTokenPrismaMapper } from "@infrastructure/mappers/refresh-token.prisma.mapper";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";

vi.mock("@infrastructure/mappers/refresh-token.prisma.mapper", () => ({
    RefreshTokenPrismaMapper: {
        toDomain: vi.fn(),
    },
}));

describe("Prisma Refresh Token Repository", () => {
    /**
     * Arrange (Global)
     */
    let repository: PrismaRefreshTokenRepository;
    let mockPrisma: any; // Prisma'nın dublörü

    beforeEach(() => {
        mockPrisma = {
            refreshToken: {
                create: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                deleteMany: vi.fn(),
                updateMany: vi.fn(),
            },
        };

        repository = new PrismaRefreshTokenRepository(
            mockPrisma as unknown as PrismaTransactionalClient,
        );

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe("Create Refresh Token create()", () => {
        it("Should create a refresh token in the database and return the domain entity.", async () => {
            const inputData = {
                tokenHash: "hashed_token_string",
                userId: "user-123",
                deviceIp: "192.168.1.1",
                userAgent: "Mozilla Firefox",
                expiresAt: new Date("2026-04-10T12:00:00Z"),
            };

            const mockRawToken = { id: "token-1", ...inputData };
            const mockDomainEntity = {
                id: "domain-1",
                token: "hashed_token_string",
            };

            mockPrisma.refreshToken.create.mockResolvedValue(mockRawToken);

            vi.mocked(RefreshTokenPrismaMapper.toDomain).mockReturnValue(
                mockDomainEntity as any,
            );

            // Act
            const result = await repository.create(inputData);

            // Assert
            expect(mockPrisma.refreshToken.create).toHaveBeenCalledTimes(1);
            expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
                data: {
                    token: inputData.tokenHash,
                    userId: inputData.userId,
                    deviceIp: inputData.deviceIp,
                    userAgent: inputData.userAgent,
                    expiresAt: inputData.expiresAt,
                },
            });

            expect(RefreshTokenPrismaMapper.toDomain).toHaveBeenCalledWith(
                mockRawToken,
            );
            expect(result).toBe(mockDomainEntity);
        });
    });

    describe("Find Token by Hash findByTokenHash()", () => {
        it("Should return null if the token hash does not exist in the database.", async () => {
            // Arrange
            const tokenHash = "invalid_hash";

            mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

            // Act
            const result = await repository.findByTokenHash(tokenHash);

            // Assert
            expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
                where: { token: tokenHash },
            });
            expect(result).toBeNull();
            expect(RefreshTokenPrismaMapper.toDomain).not.toHaveBeenCalled();
        });

        it("Should return the mapped domain entity if the token is found.", async () => {
            // Arrange
            const tokenHash = "valid_hash";
            const mockRawToken = { id: "token-1", token: tokenHash };
            const mockDomainEntity = { id: "domain-1" };

            mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRawToken);
            vi.mocked(RefreshTokenPrismaMapper.toDomain).mockReturnValue(
                mockDomainEntity as any,
            );

            // Act
            const result = await repository.findByTokenHash(tokenHash);

            // Assert
            expect(result).toBe(mockDomainEntity);
            expect(RefreshTokenPrismaMapper.toDomain).toHaveBeenCalledWith(
                mockRawToken,
            );
        });
    });

    describe("Update Token update()", () => {
        it("Should update the token's isRevoked status and updatedAt fields.", async () => {
            // Arrange
            const mockDomainToken = { id: "token-123", isRevoked: true };

            // Act
            await repository.update(mockDomainToken as any);

            // Assert
            expect(mockPrisma.refreshToken.update).toHaveBeenCalledTimes(1);
            expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
                where: { id: mockDomainToken.id },
                data: {
                    isRevoked: true,
                    updatedAt: new Date("2026-03-10T12:00:00Z"),
                },
            });
        });
    });

    describe("Delete Invalid Tokens deleteInvalidBefore()", () => {
        it("Should delete expired or revoked tokens before a certain date and return the count.", async () => {
            // Arrange
            const dateThreshold = new Date("2026-03-01T00:00:00Z");

            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

            // Act
            const deletedCount =
                await repository.deleteInvalidBefore(dateThreshold);

            // Assert
            expect(deletedCount).toBe(5);
            expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        {
                            isRevoked: true,
                            updatedAt: { lt: dateThreshold },
                        },
                        {
                            expiresAt: { lt: dateThreshold },
                        },
                    ],
                },
            });
        });
    });

    describe("Revoke All Tokens by User ID revokeAllByUserId()", () => {
        it("Should revoke all active tokens for a given user.", async () => {
            // Arrange
            const userId = "user-789";

            // Act
            await repository.revokeAllByUserId(userId);

            // Assert
            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledTimes(1);
            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: {
                    userId: userId,
                    isRevoked: false,
                },
                data: {
                    isRevoked: true,
                    updatedAt: new Date("2026-03-10T12:00:00Z"),
                },
            });
        });
    });
});
