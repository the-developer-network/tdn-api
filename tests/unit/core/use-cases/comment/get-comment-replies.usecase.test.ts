import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetCommentRepliesUseCase } from "@core/use-cases/comment/get-comment-replies/get-comment-replies.usecase";
import { NotFoundError } from "@core/errors";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import { buildComment } from "../../../helpers/mock-factories";

describe("GetCommentRepliesUseCase", () => {
    let useCase: GetCommentRepliesUseCase;
    let commentRepo: Pick<
        ICommentRepository,
        "findById" | "findRepliesByParentId"
    >;

    beforeEach(() => {
        commentRepo = {
            findById: vi.fn(),
            findRepliesByParentId: vi.fn(),
        };
        useCase = new GetCommentRepliesUseCase(
            commentRepo as ICommentRepository,
        );
    });

    it("should throw NotFoundError when parent comment does not exist", async () => {
        vi.mocked(commentRepo.findById).mockResolvedValue(null);

        await expect(
            useCase.execute({ commentId: "comment-1", page: 1, limit: 10 }),
        ).rejects.toThrow(NotFoundError);
    });

    it("should return replies for the given parent comment", async () => {
        const parent = buildComment({ id: "comment-1" });
        const replies = [
            buildComment({ id: "reply-1", parentId: "comment-1" }),
            buildComment({ id: "reply-2", parentId: "comment-1" }),
        ];

        vi.mocked(commentRepo.findById).mockResolvedValue(parent);
        vi.mocked(commentRepo.findRepliesByParentId).mockResolvedValue(replies);

        const result = await useCase.execute({
            commentId: "comment-1",
            page: 1,
            limit: 10,
        });

        expect(result).toBe(replies);
        expect(commentRepo.findRepliesByParentId).toHaveBeenCalledWith(
            "comment-1",
            10,
            0,
            undefined,
        );
    });

    it("should calculate offset correctly for pagination", async () => {
        const parent = buildComment({ id: "comment-1" });
        vi.mocked(commentRepo.findById).mockResolvedValue(parent);
        vi.mocked(commentRepo.findRepliesByParentId).mockResolvedValue([]);

        await useCase.execute({ commentId: "comment-1", page: 3, limit: 5 });

        expect(commentRepo.findRepliesByParentId).toHaveBeenCalledWith(
            "comment-1",
            5,
            10,
            undefined,
        );
    });

    it("should pass currentUserId to the repository", async () => {
        const parent = buildComment({ id: "comment-1" });
        vi.mocked(commentRepo.findById).mockResolvedValue(parent);
        vi.mocked(commentRepo.findRepliesByParentId).mockResolvedValue([]);

        await useCase.execute({
            commentId: "comment-1",
            page: 1,
            limit: 10,
            currentUserId: "user-99",
        });

        expect(commentRepo.findRepliesByParentId).toHaveBeenCalledWith(
            "comment-1",
            10,
            0,
            "user-99",
        );
    });
});
