import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { PrismaProfileRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-profile.repository";
import { PrismaUserRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-user.repository";
import { createPrismaClient } from "../../helpers/setup";

describe("PrismaProfileRepository (integration)", () => {
    let prisma: PrismaClient;
    let profileRepo: PrismaProfileRepository;
    let testUserId: string;
    let testUsername: string;

    beforeAll(async () => {
        prisma = createPrismaClient();
        profileRepo = new PrismaProfileRepository(prisma);

        const userRepo = new PrismaUserRepository(prisma, {
            gracePeriodDays: 30,
        });
        const user = await userRepo.create({
            email: "profileuser@profile-repo-test.com",
            username: "profileuser_profilerepo",
            passwordHash: "hashed",
        });
        testUserId = user.id;
        testUsername = user.username;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { contains: "@profile-repo-test.com" } },
        });
        await prisma.$disconnect();
    });

    describe("findByUserId()", () => {
        it("should return the profile for an existing user", async () => {
            const profile = await profileRepo.findByUserId(testUserId);
            expect(profile).not.toBeNull();
            expect(profile!.userId).toBe(testUserId);
        });

        it("should return null for a non-existent userId", async () => {
            const profile = await profileRepo.findByUserId(
                "00000000-0000-0000-0000-000000000000",
            );
            expect(profile).toBeNull();
        });
    });

    describe("findByUsername()", () => {
        it("should return profile when found by username", async () => {
            const profile = await profileRepo.findByUsername(testUsername);
            expect(profile).not.toBeNull();
            expect(profile!.userId).toBe(testUserId);
        });

        it("should return null for unknown username", async () => {
            const profile = await profileRepo.findByUsername(
                "ghost_nonexistent_profilerepo",
            );
            expect(profile).toBeNull();
        });
    });

    describe("update()", () => {
        it("should update profile fields partially", async () => {
            await profileRepo.update(testUserId, {
                userId: testUserId,
                bio: "My integration bio",
            });

            const profile = await profileRepo.findByUserId(testUserId);
            expect(profile!.bio).toBe("My integration bio");
        });

        it("should not overwrite untouched fields", async () => {
            // First set fullName
            await profileRepo.update(testUserId, {
                userId: testUserId,
                fullName: "Test Full Name",
            });
            // Then update only bio
            await profileRepo.update(testUserId, {
                userId: testUserId,
                bio: "Bio only update",
            });

            const profile = await profileRepo.findByUserId(testUserId);
            expect(profile!.bio).toBe("Bio only update");
            expect(profile!.fullName).toBe("Test Full Name");
        });
    });

    describe("search()", () => {
        beforeAll(async () => {
            const userRepo = new PrismaUserRepository(prisma, {
                gracePeriodDays: 30,
            });
            const user2 = await userRepo.create({
                email: "searchable@profile-repo-test.com",
                username: "searchable_profilerepo",
                passwordHash: "hashed",
            });
            await profileRepo.update(user2.id, {
                userId: user2.id,
                fullName: "Searchable Person Profilerepo",
            });
        });

        it("should find profiles matching a case-insensitive query", async () => {
            const results = await profileRepo.search("SEARCHABLE", 10);
            expect(results.length).toBeGreaterThanOrEqual(1);
            const found = results.find((p) =>
                p.fullName?.toLowerCase().includes("searchable"),
            );
            expect(found).toBeDefined();
        });

        it("should return empty array when nothing matches", async () => {
            const results = await profileRepo.search(
                "zzznomatch_profilerepo_xyz",
            );
            expect(results).toHaveLength(0);
        });
    });
});
