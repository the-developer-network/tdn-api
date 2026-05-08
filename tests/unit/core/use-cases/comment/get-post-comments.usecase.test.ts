import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetPostCommentsUseCase } from "@core/use-cases/comment/get-post-comments/get-post-comments.usecase";
import { NotFoundError } from "@core/errors";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { Post } from "@core/domain/entities/post.entity";
import { buildComment } from "../../../helpers/mock-factories";

const buildPost = (): Post => ({ id: "post-1" }) as unknown as Post;

describe("GetPostCommentsUseCase", () => {
    let useCase: GetPostCommentsUseCase;
    let postRepo: Pick<IPostRepository, "findById">;
    let commentRepo: Pick<ICommentRepository, "findTopLevelByPostId">;

    beforeEach(() => {
        postRepo = { findById: vi.fn() };
        commentRepo = { findTopLevelByPostId: vi.fn() };

        useCase = new GetPostCommentsUseCase(
            commentRepo as ICommentRepository,
            postRepo as IPostRepository,
        );
    });

    it("should throw NotFoundError when post does not exist", async () => {
        vi.mocked(postRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute({ postId: "post-1" })).rejects.toThrow(
            NotFoundError,
        );
    });

    it("should return top-level comments for the post", async () => {
        const comments = [buildComment(), buildComment({ id: "comment-2" })];
        vi.mocked(postRepo.findById).mockResolvedValue(buildPost());
        vi.mocked(commentRepo.findTopLevelByPostId).mockResolvedValue(comments);

        const result = await useCase.execute({ postId: "post-1" });

        expect(result).toBe(comments);
        expect(commentRepo.findTopLevelByPostId).toHaveBeenCalledWith(
            "post-1",
            10,
            0,
            undefined,
        );
    });

    it("should calculate offset correctly for pagination", async () => {
        vi.mocked(postRepo.findById).mockResolvedValue(buildPost());
        vi.mocked(commentRepo.findTopLevelByPostId).mockResolvedValue([]);

        await useCase.execute({ postId: "post-1", page: 2, limit: 20 });

        expect(commentRepo.findTopLevelByPostId).toHaveBeenCalledWith(
            "post-1",
            20,
            20,
            undefined,
        );
    });

    it("should pass currentUserId to the repository", async () => {
        vi.mocked(postRepo.findById).mockResolvedValue(buildPost());
        vi.mocked(commentRepo.findTopLevelByPostId).mockResolvedValue([]);

        await useCase.execute({ postId: "post-1", currentUserId: "user-5" });

        expect(commentRepo.findTopLevelByPostId).toHaveBeenCalledWith(
            "post-1",
            10,
            0,
            "user-5",
        );
    });
});
