import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { PrismaBookmarkRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-bookmark.repository";
import { PrismaUserRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-user.repository";
import { PrismaPostRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-post.repository";
import { Post } from "../../../../src/core/domain/entities/post.entity";
import { PostType } from "../../../../src/core/domain/enums/post-type.enum";
import { createPrismaClient } from "../../helpers/setup";

describe("PrismaBookmarkRepository (integration)", () => {
    let prisma: PrismaClient;
    let bookmarkRepo: PrismaBookmarkRepository;
    let testUserId: string;
    let testPostId: string;

    beforeAll(async () => {
        prisma = createPrismaClient();
        bookmarkRepo = new PrismaBookmarkRepository(prisma);

        const userRepo = new PrismaUserRepository(prisma, {
            gracePeriodDays: 30,
        });
        const postRepo = new PrismaPostRepository(prisma);

        const user = await userRepo.create({
            email: "bookmarkuser@bookmark-repo-test.com",
            username: "bookmarkuser_bmrepo",
            passwordHash: "hashed",
        });
        testUserId = user.id;

        const post = await postRepo.create(
            Post.create("Bookmark test post", PostType.COMMUNITY, testUserId),
        );
        testPostId = post.id;
    });

    afterAll(async () => {
        await prisma.postBookmark.deleteMany({ where: { userId: testUserId } });
        await prisma.post.deleteMany({ where: { authorId: testUserId } });
        await prisma.user.deleteMany({
            where: { email: { contains: "@bookmark-repo-test.com" } },
        });
        await prisma.$disconnect();
    });

    describe("save() / isBookmarked()", () => {
        it("should save a bookmark and confirm it exists", async () => {
            await bookmarkRepo.save(testPostId, testUserId);

            const bookmarked = await bookmarkRepo.isBookmarked(
                testPostId,
                testUserId,
            );
            expect(bookmarked).toBe(true);
        });
    });

    describe("remove()", () => {
        it("should remove a bookmark", async () => {
            await bookmarkRepo.remove(testPostId, testUserId);

            const bookmarked = await bookmarkRepo.isBookmarked(
                testPostId,
                testUserId,
            );
            expect(bookmarked).toBe(false);
        });
    });

    describe("isBookmarked()", () => {
        it("should return false for a post that has not been bookmarked", async () => {
            const userRepo = new PrismaUserRepository(prisma, {
                gracePeriodDays: 30,
            });
            const otherUser = await userRepo.create({
                email: "otherbookmark@bookmark-repo-test.com",
                username: "otherbm_bmrepo",
                passwordHash: "hashed",
            });

            const result = await bookmarkRepo.isBookmarked(
                testPostId,
                otherUser.id,
            );
            expect(result).toBe(false);
        });
    });
});
