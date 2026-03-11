import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import { PrismaVerificationTokenRepository } from "@infrastructure/repositories/prisma-verification-token.repository";
import { VerificationTokenPrismaMapper } from "@infrastructure/mappers/verification-token.prisma.mapper";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";
import type { TokenType } from "@core/entities/verification-token.entity";

vi.mock("@infrastructure/mappers/verification-token.prisma.mapper", () => ({
    VerificationTokenPrismaMapper: {
        toDomain: vi.fn(),
    },
}));

describe("Prisma Verification Token Repository", () => {
    /**
     * Arrange (Global)
     */
    let repository: PrismaVerificationTokenRepository;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            verificationToken: {
                upsert: vi.fn(),
                findUnique: vi.fn(),
                delete: vi.fn(),
            },
        };

        repository = new PrismaVerificationTokenRepository(
            mockPrisma as unknown as PrismaTransactionalClient,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Upsert Verification Token upsert()", () => {
        it("Should execute Prisma upsert with correct payload and return domain entity.", async () => {
            // Arrange
            const inputData = {
                userId: "user-123",
                tokenHash: "hashed_otp_code",
                type: "EMAIL_VERIFICATION" as TokenType,
                expiresAt: new Date("2026-03-10T12:15:00Z"),
            };

            const mockRawToken = { id: "token-1", ...inputData };
            const mockDomainEntity = {
                id: "domain-1",
                token: "hashed_otp_code",
            };

            mockPrisma.verificationToken.upsert.mockResolvedValue(mockRawToken);
            vi.mocked(VerificationTokenPrismaMapper.toDomain).mockReturnValue(
                mockDomainEntity as any,
            );

            // Act
            const result = await repository.upsert(inputData);

            // Assert
            expect(mockPrisma.verificationToken.upsert).toHaveBeenCalledTimes(
                1,
            );
            expect(mockPrisma.verificationToken.upsert).toHaveBeenCalledWith({
                where: {
                    userId_type: {
                        userId: inputData.userId,
                        type: inputData.type,
                    },
                },
                update: {
                    token: inputData.tokenHash,
                    expiresAt: inputData.expiresAt,
                },
                create: {
                    userId: inputData.userId,
                    token: inputData.tokenHash,
                    type: inputData.type,
                    expiresAt: inputData.expiresAt,
                },
            });

            expect(VerificationTokenPrismaMapper.toDomain).toHaveBeenCalledWith(
                mockRawToken,
            );
            expect(result).toBe(mockDomainEntity);
        });
    });

    describe("Find Token By User ID and Type findByUserIdAndType()", () => {
        it("Should return the mapped domain entity if token exists.", async () => {
            // Arrange
            const userId = "user-123";
            const type = "PASSWORD_RESET" as TokenType;
            const mockRawToken = { id: "token-2", userId, type };
            const mockDomainEntity = { id: "domain-2" };

            mockPrisma.verificationToken.findUnique.mockResolvedValue(
                mockRawToken,
            );
            vi.mocked(VerificationTokenPrismaMapper.toDomain).mockReturnValue(
                mockDomainEntity as any,
            );

            // Act
            const result = await repository.findByUserIdAndType(userId, type);

            // Assert
            expect(
                mockPrisma.verificationToken.findUnique,
            ).toHaveBeenCalledWith({
                where: {
                    userId_type: { userId, type },
                },
            });
            expect(VerificationTokenPrismaMapper.toDomain).toHaveBeenCalledWith(
                mockRawToken,
            );
            expect(result).toBe(mockDomainEntity);
        });

        it("Should return null if the token does not exist.", async () => {
            // Arrange
            const userId = "user-unknown";
            const type = "EMAIL_VERIFICATION" as TokenType;

            mockPrisma.verificationToken.findUnique.mockResolvedValue(null);

            // Act
            const result = await repository.findByUserIdAndType(userId, type);

            // Assert
            expect(result).toBeNull();
            expect(
                VerificationTokenPrismaMapper.toDomain,
            ).not.toHaveBeenCalled();
        });
    });

    describe("Delete Token delete()", () => {
        it("Should call prisma delete with the correct token ID.", async () => {
            // Arrange
            const tokenId = "token-123";

            // Act
            await repository.delete(tokenId);

            // Assert
            expect(mockPrisma.verificationToken.delete).toHaveBeenCalledTimes(
                1,
            );
            expect(mockPrisma.verificationToken.delete).toHaveBeenCalledWith({
                where: { id: tokenId },
            });
        });
    });
});
