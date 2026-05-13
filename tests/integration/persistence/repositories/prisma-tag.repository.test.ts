import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { PrismaTagRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-tag.repository";
import { PrismaUserRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-user.repository";
import { PrismaPostRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-post.repository";
import { Post } from "../../../../src/core/domain/entities/post.entity";
import { PostType } from "../../../../src/core/domain/enums/post-type.enum";
import { createPrismaClient } from "../../helpers/setup";

describe("PrismaTagRepository (integration)", () => {
    let prisma: PrismaClient;
    let tagRepo: PrismaTagRepository;
    let testUserId: string;

    beforeAll(async () => {
        prisma = createPrismaClient();
        tagRepo = new PrismaTagRepository(prisma);

        const userRepo = new PrismaUserRepository(prisma, {
            gracePeriodDays: 30,
        });
        const postRepo = new PrismaPostRepository(prisma);

        const user = await userRepo.create({
            email: "taguser@tag-repo-test.com",
            username: "taguser_tagrepo",
            passwordHash: "hashed",
        });
        testUserId = user.id;
        await postRepo.create(
            Post.create(
                "Post with #tagrepotest1 tag",
                PostType.COMMUNITY,
                testUserId,
            ),
        );
        await postRepo.create(
            Post.create(
                "Another #tagrepotest1 post",
                PostType.COMMUNITY,
                testUserId,
            ),
        );
        await postRepo.create(
            Post.create(
                "Post with #tagrepotest2 tag",
                PostType.TECH_NEWS,
                testUserId,
            ),
        );
    });

    afterAll(async () => {
        await prisma.post.deleteMany({ where: { authorId: testUserId } });
        await prisma.user.deleteMany({
            where: { email: { contains: "@tag-repo-test.com" } },
        });
        await prisma.$disconnect();
    });

    describe("findTrending()", () => {
        it("should return trending tags within the time window", async () => {
            const trends = await tagRepo.findTrending({
                limit: 10,
                windowDays: 7,
            });

            const names = trends.map((t) => t.tag);
            expect(names).toContain("tagrepotest1");
            expect(names).toContain("tagrepotest2");
        });

        it("should order by post count descending", async () => {
            const trends = await tagRepo.findTrending({
                limit: 10,
                windowDays: 7,
            });

            const tagrepo1 = trends.find((t) => t.tag === "tagrepotest1");
            const tagrepo2 = trends.find((t) => t.tag === "tagrepotest2");

            expect(tagrepo1).toBeDefined();
            expect(tagrepo2).toBeDefined();

            const idx1 = trends.indexOf(tagrepo1!);
            const idx2 = trends.indexOf(tagrepo2!);
            expect(idx1).toBeLessThan(idx2);
        });

        it("should respect the limit parameter", async () => {
            const trends = await tagRepo.findTrending({
                limit: 1,
                windowDays: 7,
            });
            expect(trends.length).toBeLessThanOrEqual(1);
        });

        it("should return empty array when window excludes all posts", async () => {
            const trends = await tagRepo.findTrending({
                limit: 10,
                windowDays: 0,
            });
            expect(trends).toHaveLength(0);
        });
    });

    describe("search()", () => {
        it("should find tags matching a case-insensitive query", async () => {
            const results = await tagRepo.search("TAGREPOTEST", 10);

            expect(results.length).toBeGreaterThanOrEqual(2);
            const names = results.map((r) => r.name);
            expect(names).toContain("tagrepotest1");
            expect(names).toContain("tagrepotest2");
        });

        it("should return empty array when nothing matches", async () => {
            const results = await tagRepo.search("zzznomatch_tagrepo_xyz");
            expect(results).toHaveLength(0);
        });

        it("should respect limit parameter", async () => {
            const results = await tagRepo.search("tagrepotest", 1);
            expect(results.length).toBeLessThanOrEqual(1);
        });
    });
});
