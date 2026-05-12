import { describe, expect, it } from "vitest";
import { VerificationTokenPrismaMapper } from "@infrastructure/persistence/mappers/verification-token.prisma.mapper";
import { TokenType } from "@core/domain/enums/token-type.enum";
import type { VerificationToken as PrismaVerificationToken } from "@generated/prisma/client";

const now = new Date("2025-01-01T00:00:00.000Z");
const expiresAt = new Date("2025-01-01T00:10:00.000Z");

const basePrismaToken: PrismaVerificationToken = {
    id: "vtoken-1",
    token: "otp_hash_value",
    userId: "user-1",
    type: "EMAIL_VERIFICATION" as PrismaVerificationToken["type"],
    expiresAt,
    createdAt: now,
};

describe("VerificationTokenPrismaMapper", () => {
    describe("toDomain", () => {
        it("should map DB token field to entity tokenHash", () => {
            const token =
                VerificationTokenPrismaMapper.toDomain(basePrismaToken);

            expect(token.tokenHash).toBe("otp_hash_value");
        });

        it("should map all fields correctly", () => {
            const token =
                VerificationTokenPrismaMapper.toDomain(basePrismaToken);

            expect(token.id).toBe("vtoken-1");
            expect(token.userId).toBe("user-1");
            expect(token.expiresAt).toBe(expiresAt);
            expect(token.createdAt).toBe(now);
        });

        it("should cast type string to TokenType enum", () => {
            const token =
                VerificationTokenPrismaMapper.toDomain(basePrismaToken);

            expect(token.type).toBe(TokenType.EMAIL_VERIFICATION);
        });

        it("should handle PASSWORD_RESET token type", () => {
            const token = VerificationTokenPrismaMapper.toDomain({
                ...basePrismaToken,
                type: "PASSWORD_RESET" as PrismaVerificationToken["type"],
            });

            expect(token.type).toBe(TokenType.PASSWORD_RESET);
        });
    });
});
