import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { PrismaRefreshTokenRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-refresh-token.repository";
import { PrismaUserRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-user.repository";
import { createPrismaClient } from "../../helpers/setup";

describe("PrismaRefreshTokenRepository (integration)", () => {
    let prisma: PrismaClient;
    let repo: PrismaRefreshTokenRepository;
    let testUserId: string;

    beforeAll(async () => {
        prisma = createPrismaClient();
        repo = new PrismaRefreshTokenRepository(prisma, {
            gracePeriodDays: 30,
        });

        const userRepo = new PrismaUserRepository(prisma, {
            gracePeriodDays: 30,
        });
        const user = await userRepo.create({
            email: "refreshtoken@token-repo-test.com",
            username: "refreshtoken_tokenrepo",
            passwordHash: "hashed",
        });
        testUserId = user.id;
    });

    afterAll(async () => {
        await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
        await prisma.user.deleteMany({
            where: { email: { contains: "@token-repo-test.com" } },
        });
        await prisma.$disconnect();
    });

    describe("create() / findByTokenHash()", () => {
        it("should persist a token and retrieve it by hash", async () => {
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
            const token = await repo.create({
                tokenHash: "hash_roundtrip_test_tokenrepo",
                userId: testUserId,
                deviceIp: "127.0.0.1",
                userAgent: "test-agent",
                expiresAt,
            });

            expect(token.id).toBeDefined();
            expect(token.tokenHash).toBe("hash_roundtrip_test_tokenrepo");
            expect(token.userId).toBe(testUserId);
            expect(token.isRevoked).toBe(false);

            const found = await repo.findByTokenHash(
                "hash_roundtrip_test_tokenrepo",
            );
            expect(found).not.toBeNull();
            expect(found!.id).toBe(token.id);
        });

        it("should return null for unknown hash", async () => {
            const found = await repo.findByTokenHash("nonexistent_hash_xyz");
            expect(found).toBeNull();
        });
    });

    describe("update() — revoke token", () => {
        it("should mark token as revoked", async () => {
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
            const token = await repo.create({
                tokenHash: "hash_revoke_test_tokenrepo",
                userId: testUserId,
                deviceIp: "127.0.0.1",
                userAgent: "test-agent",
                expiresAt,
            });

            expect(token.isRevoked).toBe(false);

            token.revoke();
            await repo.update(token);

            const updated = await repo.findByTokenHash(
                "hash_revoke_test_tokenrepo",
            );
            expect(updated!.isRevoked).toBe(true);
        });
    });

    describe("revokeAllByUserId()", () => {
        it("should revoke all active tokens for a user", async () => {
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

            const userRepo = new PrismaUserRepository(prisma, {
                gracePeriodDays: 30,
            });
            const user2 = await userRepo.create({
                email: "revoke2@token-repo-test.com",
                username: "revoke2_tokenrepo",
                passwordHash: "hashed",
            });

            await repo.create({
                tokenHash: "hash_revoke_all_1_tokenrepo",
                userId: user2.id,
                deviceIp: "127.0.0.1",
                userAgent: "agent1",
                expiresAt,
            });
            await repo.create({
                tokenHash: "hash_revoke_all_2_tokenrepo",
                userId: user2.id,
                deviceIp: "127.0.0.2",
                userAgent: "agent2",
                expiresAt,
            });

            await repo.revokeAllByUserId(user2.id);

            const tokens = await prisma.refreshToken.findMany({
                where: { userId: user2.id },
            });

            expect(tokens).toHaveLength(2);
            expect(tokens.every((t) => t.isRevoked)).toBe(true);
        });
    });

    describe("deleteExpiredTokens()", () => {
        it("should delete expired tokens and keep valid ones", async () => {
            const userRepo = new PrismaUserRepository(prisma, {
                gracePeriodDays: 30,
            });
            const user3 = await userRepo.create({
                email: "expired@token-repo-test.com",
                username: "expired_tokenrepo",
                passwordHash: "hashed",
            });

            const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24);
            const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

            await repo.create({
                tokenHash: "hash_expired_tokenrepo",
                userId: user3.id,
                deviceIp: "127.0.0.1",
                userAgent: "agent",
                expiresAt: pastDate,
            });
            await repo.create({
                tokenHash: "hash_valid_tokenrepo",
                userId: user3.id,
                deviceIp: "127.0.0.1",
                userAgent: "agent",
                expiresAt: futureDate,
            });

            const deleted = await repo.deleteExpiredTokens();

            expect(deleted).toBeGreaterThanOrEqual(1);

            const remaining = await prisma.refreshToken.findMany({
                where: { userId: user3.id },
            });
            expect(remaining.every((t) => t.expiresAt > new Date())).toBe(true);
        });
    });
});
