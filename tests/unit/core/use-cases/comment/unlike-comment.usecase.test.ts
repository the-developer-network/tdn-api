import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnlikeCommentUseCase } from "@core/use-cases/comment/unlike-comment/unlike-comment.usecase";
import { NotFoundError } from "@core/errors";
import type {
    TransactionPort,
    TransactionContext,
} from "@core/ports/services/transaction.port";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import { buildComment } from "../../../helpers/mock-factories";

describe("UnlikeCommentUseCase", () => {
    let useCase: UnlikeCommentUseCase;
    let transactionSvc: Pick<TransactionPort, "runInTransaction">;
    let txCommentRepo: Pick<
        ICommentRepository,
        "findById" | "hasUserLiked" | "removeLike" | "decrementLikeCount"
    >;

    const input = { commentId: "comment-1", userId: "user-1" };

    const buildTransactionContext = (): TransactionContext =>
        ({
            commentRepository: txCommentRepo as ICommentRepository,
        }) as TransactionContext;

    beforeEach(() => {
        txCommentRepo = {
            findById: vi.fn(),
            hasUserLiked: vi.fn(),
            removeLike: vi.fn(),
            decrementLikeCount: vi.fn(),
        };
        transactionSvc = { runInTransaction: vi.fn() };

        vi.mocked(transactionSvc.runInTransaction).mockImplementation(
            async (work) => work(buildTransactionContext()),
        );

        useCase = new UnlikeCommentUseCase(transactionSvc as TransactionPort);
    });

    it("should throw NotFoundError when comment does not exist", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it("should do nothing when comment is not liked (idempotent)", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(buildComment());
        vi.mocked(txCommentRepo.hasUserLiked).mockResolvedValue(false);

        await useCase.execute(input);

        expect(txCommentRepo.removeLike).not.toHaveBeenCalled();
        expect(txCommentRepo.decrementLikeCount).not.toHaveBeenCalled();
    });

    it("should remove like and decrement count when comment is liked", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(buildComment());
        vi.mocked(txCommentRepo.hasUserLiked).mockResolvedValue(true);
        vi.mocked(txCommentRepo.removeLike).mockResolvedValue(undefined);
        vi.mocked(txCommentRepo.decrementLikeCount).mockResolvedValue(
            undefined,
        );

        await useCase.execute(input);

        expect(txCommentRepo.removeLike).toHaveBeenCalledWith(
            "comment-1",
            "user-1",
        );
        expect(txCommentRepo.decrementLikeCount).toHaveBeenCalledWith(
            "comment-1",
        );
    });
});
