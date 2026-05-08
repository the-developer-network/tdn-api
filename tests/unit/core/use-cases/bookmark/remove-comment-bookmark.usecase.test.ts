import { beforeEach, describe, expect, it, vi } from "vitest";
import { RemoveCommentBookmarkUseCase } from "@core/use-cases/bookmark/remove-comment-bookmark/remove-comment-bookmark.usecase";
import { NotFoundError } from "@core/errors";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { ICommentBookmarkRepository } from "@core/ports/repositories/comment-bookmark.repository";
import type { Comment } from "@core/domain/entities/comment.entity";

describe("RemoveCommentBookmarkUseCase", () => {
    let useCase: RemoveCommentBookmarkUseCase;
    let commentRepo: Pick<ICommentRepository, "findById">;
    let commentBookmarkRepo: Pick<
        ICommentBookmarkRepository,
        "isBookmarked" | "remove"
    >;

    const input = { commentId: "comment-1", userId: "user-1" };

    beforeEach(() => {
        commentRepo = { findById: vi.fn() };
        commentBookmarkRepo = { isBookmarked: vi.fn(), remove: vi.fn() };

        useCase = new RemoveCommentBookmarkUseCase(
            commentRepo as ICommentRepository,
            commentBookmarkRepo as ICommentBookmarkRepository,
        );
    });

    it("should throw NotFoundError when comment does not exist", async () => {
        vi.mocked(commentRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
        expect(commentBookmarkRepo.remove).not.toHaveBeenCalled();
    });

    it("should not remove when comment is not bookmarked", async () => {
        vi.mocked(commentRepo.findById).mockResolvedValue({} as Comment);
        vi.mocked(commentBookmarkRepo.isBookmarked).mockResolvedValue(false);

        await useCase.execute(input);

        expect(commentBookmarkRepo.remove).not.toHaveBeenCalled();
    });

    it("should remove bookmark when comment is bookmarked", async () => {
        vi.mocked(commentRepo.findById).mockResolvedValue({} as Comment);
        vi.mocked(commentBookmarkRepo.isBookmarked).mockResolvedValue(true);
        vi.mocked(commentBookmarkRepo.remove).mockResolvedValue();

        await useCase.execute(input);

        expect(commentBookmarkRepo.remove).toHaveBeenCalledWith(
            input.commentId,
            input.userId,
        );
    });
});
