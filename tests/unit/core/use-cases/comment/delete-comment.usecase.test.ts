import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteCommentUseCase } from "@core/use-cases/comment/delete-comment/delete-comment.usecase";
import { NotFoundError, ForbiddenError } from "@core/errors";
import type {
    TransactionPort,
    TransactionContext,
} from "@core/ports/services/transaction.port";
import type { CachePort } from "@core/ports/services/cache.port";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import { buildComment } from "../../../helpers/mock-factories";

describe("DeleteCommentUseCase", () => {
    let useCase: DeleteCommentUseCase;
    let transactionSvc: Pick<TransactionPort, "runInTransaction">;
    let cacheSvc: Pick<CachePort, "deleteByPattern">;
    let txCommentRepo: Pick<
        ICommentRepository,
        "findById" | "delete" | "decrementRepliesCount"
    >;
    let txPostRepo: Pick<IPostRepository, "decrementCommentsCount">;

    const input = { commentId: "comment-1", userId: "user-1" };

    const buildTransactionContext = (): TransactionContext =>
        ({
            commentRepository: txCommentRepo as ICommentRepository,
            postRepository: txPostRepo as IPostRepository,
        }) as TransactionContext;

    beforeEach(() => {
        txCommentRepo = {
            findById: vi.fn(),
            delete: vi.fn(),
            decrementRepliesCount: vi.fn(),
        };
        txPostRepo = { decrementCommentsCount: vi.fn() };
        cacheSvc = { deleteByPattern: vi.fn() };
        transactionSvc = { runInTransaction: vi.fn() };

        vi.mocked(transactionSvc.runInTransaction).mockImplementation(
            async (work) => work(buildTransactionContext()),
        );

        useCase = new DeleteCommentUseCase(
            transactionSvc as TransactionPort,
            cacheSvc as CachePort,
        );
    });

    it("should throw NotFoundError when comment does not exist", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when user is not the comment author", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(
            buildComment({ authorId: "other-user" }),
        );

        await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });

    it("should delete top-level comment and decrement post comment count", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(
            buildComment({ authorId: "user-1", parentId: null }),
        );
        vi.mocked(txCommentRepo.delete).mockResolvedValue(undefined);
        vi.mocked(txPostRepo.decrementCommentsCount).mockResolvedValue(
            undefined,
        );
        vi.mocked(cacheSvc.deleteByPattern).mockResolvedValue(undefined);

        await useCase.execute(input);

        expect(txCommentRepo.delete).toHaveBeenCalledWith("comment-1");
        expect(txPostRepo.decrementCommentsCount).toHaveBeenCalledWith(
            "post-1",
        );
        expect(txCommentRepo.decrementRepliesCount).not.toHaveBeenCalled();
        expect(cacheSvc.deleteByPattern).toHaveBeenCalledWith("posts:feed:*");
    });

    it("should also decrement parent repliesCount when deleting a reply", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(
            buildComment({ authorId: "user-1", parentId: "parent-1" }),
        );
        vi.mocked(txCommentRepo.delete).mockResolvedValue(undefined);
        vi.mocked(txPostRepo.decrementCommentsCount).mockResolvedValue(
            undefined,
        );
        vi.mocked(txCommentRepo.decrementRepliesCount).mockResolvedValue(
            undefined,
        );
        vi.mocked(cacheSvc.deleteByPattern).mockResolvedValue(undefined);

        await useCase.execute(input);

        expect(txCommentRepo.decrementRepliesCount).toHaveBeenCalledWith(
            "parent-1",
        );
    });

    it("should not throw when cache invalidation fails", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(
            buildComment({ authorId: "user-1" }),
        );
        vi.mocked(txCommentRepo.delete).mockResolvedValue(undefined);
        vi.mocked(txPostRepo.decrementCommentsCount).mockResolvedValue(
            undefined,
        );
        vi.mocked(cacheSvc.deleteByPattern).mockRejectedValue(
            new Error("Cache unavailable"),
        );

        await expect(useCase.execute(input)).resolves.toBeUndefined();
    });
});
