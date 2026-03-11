import { describe, it, expect } from "vitest";
import { VerificationTokenPrismaMapper } from "@infrastructure/mappers/verification-token.prisma.mapper";
import { VerificationToken } from "@core/entities/verification-token.entity";

describe("Verification Token Prisma Mapper", () => {
    describe("toDomain()", () => {
        it("Should correctly map a raw Prisma token to a domain VerificationToken entity.", () => {
            /**
             * Arrange
             */
            const mockRawPrismaToken = {
                id: "token-123",
                token: "hashed_secret_otp",
                userId: "user-456",
                type: "EMAIL_VERIFICATION",
                expiresAt: new Date("2026-03-10T15:00:00Z"),
                createdAt: new Date("2026-03-10T14:00:00Z"),
            };

            /**
             * Act
             */
            const domainEntity = VerificationTokenPrismaMapper.toDomain(
                mockRawPrismaToken as any,
            );

            /**
             * Assert
             */
            expect(domainEntity).toBeInstanceOf(VerificationToken);
            expect(domainEntity.id).toBe(mockRawPrismaToken.id);
            expect(domainEntity.userId).toBe(mockRawPrismaToken.userId);
            expect(domainEntity.expiresAt).toBe(mockRawPrismaToken.expiresAt);
            expect(domainEntity.createdAt).toBe(mockRawPrismaToken.createdAt);
        });
    });
});
