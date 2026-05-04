import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetCommentUseCase } from "@core/use-cases/comment/get-comment/get-comment.usecase";
import { NotFoundError } from "@core/errors";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import { buildComment } from "../../../helpers/mock-factories";

describe("GetCommentUseCase", () => {
    let useCase: GetCommentUseCase;
    let commentRepo: Pick<ICommentRepository, "findById">;

    beforeEach(() => {
        commentRepo = { findById: vi.fn() };
        useCase = new GetCommentUseCase(commentRepo as ICommentRepository);
    });

    it("should return the comment when it exists", async () => {
        const comment = buildComment();
        vi.mocked(commentRepo.findById).mockResolvedValue(comment);

        const result = await useCase.execute({ commentId: "comment-1" });

        expect(result).toBe(comment);
        expect(commentRepo.findById).toHaveBeenCalledWith(
            "comment-1",
            undefined,
        );
    });

    it("should pass currentUserId to the repository", async () => {
        const comment = buildComment();
        vi.mocked(commentRepo.findById).mockResolvedValue(comment);

        await useCase.execute({
            commentId: "comment-1",
            currentUserId: "user-99",
        });

        expect(commentRepo.findById).toHaveBeenCalledWith(
            "comment-1",
            "user-99",
        );
    });

    it("should throw NotFoundError when comment does not exist", async () => {
        vi.mocked(commentRepo.findById).mockResolvedValue(null);

        await expect(
            useCase.execute({ commentId: "comment-1" }),
        ).rejects.toThrow(NotFoundError);
    });
});
