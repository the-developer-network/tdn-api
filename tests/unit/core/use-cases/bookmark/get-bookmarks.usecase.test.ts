import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetBookmarksUseCase } from "@core/use-cases/bookmark/get-bookmarks/get-bookmarks.usecase";
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { ICommentBookmarkRepository } from "@core/ports/repositories/comment-bookmark.repository";
import type { Post } from "@core/domain/entities/post.entity";
import type { Comment } from "@core/domain/entities/comment.entity";

describe("GetBookmarksUseCase", () => {
    let useCase: GetBookmarksUseCase;
    let postRepo: Pick<IPostRepository, "findAll">;
    let commentBookmarkRepo: Pick<
        ICommentBookmarkRepository,
        "findBookmarkedByUserId"
    >;

    const userId = "user-1";

    beforeEach(() => {
        postRepo = { findAll: vi.fn() };
        commentBookmarkRepo = { findBookmarkedByUserId: vi.fn() };

        useCase = new GetBookmarksUseCase(
            postRepo as IPostRepository,
            commentBookmarkRepo as ICommentBookmarkRepository,
        );
    });

    it("should return bookmarked posts and comments", async () => {
        const posts = [{} as Post];
        const comments = [{} as Comment];

        vi.mocked(postRepo.findAll).mockResolvedValue({ posts, total: 1 });
        vi.mocked(commentBookmarkRepo.findBookmarkedByUserId).mockResolvedValue(
            {
                comments,
                total: 1,
            },
        );

        const result = await useCase.execute({ userId });

        expect(result.posts).toBe(posts);
        expect(result.postTotal).toBe(1);
        expect(result.comments).toBe(comments);
        expect(result.commentTotal).toBe(1);
    });

    it("should use default page=1 and limit=10 when not provided", async () => {
        vi.mocked(postRepo.findAll).mockResolvedValue({ posts: [], total: 0 });
        vi.mocked(commentBookmarkRepo.findBookmarkedByUserId).mockResolvedValue(
            {
                comments: [],
                total: 0,
            },
        );

        await useCase.execute({ userId });

        expect(postRepo.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ page: 1, limit: 10 }),
        );
        expect(commentBookmarkRepo.findBookmarkedByUserId).toHaveBeenCalledWith(
            userId,
            10,
            0, // offset = (1-1) * 10
        );
    });

    it("should calculate correct offset from page and limit", async () => {
        vi.mocked(postRepo.findAll).mockResolvedValue({ posts: [], total: 0 });
        vi.mocked(commentBookmarkRepo.findBookmarkedByUserId).mockResolvedValue(
            {
                comments: [],
                total: 0,
            },
        );

        await useCase.execute({ userId, page: 3, limit: 5 });

        expect(commentBookmarkRepo.findBookmarkedByUserId).toHaveBeenCalledWith(
            userId,
            5,
            10, // offset = (3-1) * 5
        );
    });

    it("should pass savedByUserId and currentUserId to post repository", async () => {
        vi.mocked(postRepo.findAll).mockResolvedValue({ posts: [], total: 0 });
        vi.mocked(commentBookmarkRepo.findBookmarkedByUserId).mockResolvedValue(
            {
                comments: [],
                total: 0,
            },
        );

        await useCase.execute({ userId, page: 2, limit: 20 });

        expect(postRepo.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                savedByUserId: userId,
                currentUserId: userId,
                page: 2,
                limit: 20,
            }),
        );
    });

    it("should fetch posts and comments in parallel", async () => {
        const callOrder: string[] = [];

        vi.mocked(postRepo.findAll).mockImplementation(async () => {
            callOrder.push("posts");
            return { posts: [], total: 0 };
        });
        vi.mocked(
            commentBookmarkRepo.findBookmarkedByUserId,
        ).mockImplementation(async () => {
            callOrder.push("comments");
            return { comments: [], total: 0 };
        });

        await useCase.execute({ userId });

        expect(callOrder).toContain("posts");
        expect(callOrder).toContain("comments");
        expect(postRepo.findAll).toHaveBeenCalledOnce();
        expect(
            commentBookmarkRepo.findBookmarkedByUserId,
        ).toHaveBeenCalledOnce();
    });
});
