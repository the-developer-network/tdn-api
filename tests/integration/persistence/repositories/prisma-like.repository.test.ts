import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { PrismaLikeRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-like.repository";
import { PrismaUserRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-user.repository";
import { PrismaPostRepository } from "../../../../src/infrastructure/persistence/repositories/prisma-post.repository";
import { Post } from "../../../../src/core/domain/entities/post.entity";
import { PostType } from "../../../../src/core/domain/enums/post-type.enum";
import { createPrismaClient } from "../../helpers/setup";

describe("PrismaLikeRepository (integration)", () => {
    let prisma: PrismaClient;
    let likeRepo: PrismaLikeRepository;
    let testUserId: string;
    let testPostId: string;

    beforeAll(async () => {
        prisma = createPrismaClient();
        likeRepo = new PrismaLikeRepository(prisma);

        const userRepo = new PrismaUserRepository(prisma, {
            gracePeriodDays: 30,
        });
        const postRepo = new PrismaPostRepository(prisma);

        const user = await userRepo.create({
            email: "likeuser@like-repo-test.com",
            username: "likeuser_likerepo",
            passwordHash: "hashed",
        });
        testUserId = user.id;

        const post = await postRepo.create(
            Post.create("Like test post", PostType.COMMUNITY, testUserId),
        );
        testPostId = post.id;
    });

    afterAll(async () => {
        await prisma.postLike.deleteMany({ where: { userId: testUserId } });
        await prisma.post.deleteMany({ where: { authorId: testUserId } });
        await prisma.user.deleteMany({
            where: { email: { contains: "@like-repo-test.com" } },
        });
        await prisma.$disconnect();
    });

    describe("like() / isLiked()", () => {
        it("should create a like and confirm it exists", async () => {
            await likeRepo.like(testPostId, testUserId);

            const liked = await likeRepo.isLiked(testPostId, testUserId);
            expect(liked).toBe(true);
        });
    });

    describe("unlike()", () => {
        it("should remove the like", async () => {
            await likeRepo.unlike(testPostId, testUserId);

            const liked = await likeRepo.isLiked(testPostId, testUserId);
            expect(liked).toBe(false);
        });
    });

    describe("isLiked()", () => {
        it("should return false when the user has not liked the post", async () => {
            const userRepo = new PrismaUserRepository(prisma, {
                gracePeriodDays: 30,
            });
            const otherUser = await userRepo.create({
                email: "otherlike@like-repo-test.com",
                username: "otherlike_likerepo",
                passwordHash: "hashed",
            });

            const liked = await likeRepo.isLiked(testPostId, otherUser.id);
            expect(liked).toBe(false);
        });
    });

    describe("incrementLikeCount() / decrementLikeCount()", () => {
        it("should increment likeCount on the post", async () => {
            const before = await prisma.post.findUnique({
                where: { id: testPostId },
                select: { likeCount: true },
            });

            await likeRepo.incrementLikeCount(testPostId);

            const after = await prisma.post.findUnique({
                where: { id: testPostId },
                select: { likeCount: true },
            });

            expect(after!.likeCount).toBe(before!.likeCount + 1);
        });

        it("should decrement likeCount on the post", async () => {
            const before = await prisma.post.findUnique({
                where: { id: testPostId },
                select: { likeCount: true },
            });

            await likeRepo.decrementLikeCount(testPostId);

            const after = await prisma.post.findUnique({
                where: { id: testPostId },
                select: { likeCount: true },
            });

            expect(after!.likeCount).toBe(before!.likeCount - 1);
        });
    });
});
