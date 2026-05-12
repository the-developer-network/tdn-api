import { describe, expect, it } from "vitest";
import { RefreshTokenPrismaMapper } from "@infrastructure/persistence/mappers/refresh-token.prisma.mapper";
import type { RefreshToken as PrismaRefreshToken } from "@generated/prisma/client";

const now = new Date("2025-01-01T00:00:00.000Z");
const expiresAt = new Date("2025-01-08T00:00:00.000Z");

const basePrismaToken: PrismaRefreshToken = {
    id: "token-1",
    token: "hashed_token_value",
    userId: "user-1",
    deviceIp: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    expiresAt,
    isRevoked: false,
    createdAt: now,
    updatedAt: now,
};

describe("RefreshTokenPrismaMapper", () => {
    describe("toDomain", () => {
        it("should map DB token field to entity tokenHash", () => {
            const token = RefreshTokenPrismaMapper.toDomain(basePrismaToken);

            expect(token.tokenHash).toBe("hashed_token_value");
        });

        it("should map all fields correctly", () => {
            const token = RefreshTokenPrismaMapper.toDomain(basePrismaToken);

            expect(token.id).toBe("token-1");
            expect(token.userId).toBe("user-1");
            expect(token.deviceIp).toBe("192.168.1.1");
            expect(token.userAgent).toBe("Mozilla/5.0");
            expect(token.expiresAt).toBe(expiresAt);
            expect(token.isRevoked).toBe(false);
            expect(token.createdAt).toBe(now);
            expect(token.updatedAt).toBe(now);
        });

        it("should map isRevoked true when token is revoked", () => {
            const token = RefreshTokenPrismaMapper.toDomain({
                ...basePrismaToken,
                isRevoked: true,
            });

            expect(token.isRevoked).toBe(true);
        });
    });
});
