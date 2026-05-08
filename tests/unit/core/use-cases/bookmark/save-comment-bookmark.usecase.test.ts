import { beforeEach, describe, expect, it, vi } from "vitest";
import { SaveCommentBookmarkUseCase } from "@core/use-cases/bookmark/save-comment-bookmark/save-comment-bookmark.usecase";
import { NotFoundError } from "@core/errors";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { ICommentBookmarkRepository } from "@core/ports/repositories/comment-bookmark.repository";
import type { Comment } from "@core/domain/entities/comment.entity";

describe("SaveCommentBookmarkUseCase", () => {
    let useCase: SaveCommentBookmarkUseCase;
    let commentRepo: Pick<ICommentRepository, "findById">;
    let commentBookmarkRepo: Pick<
        ICommentBookmarkRepository,
        "isBookmarked" | "save"
    >;

    const input = { commentId: "comment-1", userId: "user-1" };

    beforeEach(() => {
        commentRepo = { findById: vi.fn() };
        commentBookmarkRepo = { isBookmarked: vi.fn(), save: vi.fn() };

        useCase = new SaveCommentBookmarkUseCase(
            commentRepo as ICommentRepository,
            commentBookmarkRepo as ICommentBookmarkRepository,
        );
    });

    it("should throw NotFoundError when comment does not exist", async () => {
        vi.mocked(commentRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
        expect(commentBookmarkRepo.save).not.toHaveBeenCalled();
    });

    it("should not save bookmark when comment is already bookmarked", async () => {
        vi.mocked(commentRepo.findById).mockResolvedValue({} as Comment);
        vi.mocked(commentBookmarkRepo.isBookmarked).mockResolvedValue(true);

        await useCase.execute(input);

        expect(commentBookmarkRepo.save).not.toHaveBeenCalled();
    });

    it("should save bookmark when comment exists and is not bookmarked", async () => {
        vi.mocked(commentRepo.findById).mockResolvedValue({} as Comment);
        vi.mocked(commentBookmarkRepo.isBookmarked).mockResolvedValue(false);
        vi.mocked(commentBookmarkRepo.save).mockResolvedValue();

        await useCase.execute(input);

        expect(commentBookmarkRepo.save).toHaveBeenCalledWith(
            input.commentId,
            input.userId,
        );
    });
});
