import { beforeEach, describe, expect, it, vi } from "vitest";
import { LikeCommentUseCase } from "@core/use-cases/comment/like-comment/like-comment.usecase";
import { NotFoundError } from "@core/errors";
import type {
    TransactionPort,
    TransactionContext,
} from "@core/ports/services/transaction.port";
import type { RealtimePort } from "@core/ports/services/realtime.port";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { INotificationRepository } from "@core/ports/repositories/notification.repository";
import { buildComment } from "../../../helpers/mock-factories";

describe("LikeCommentUseCase", () => {
    let useCase: LikeCommentUseCase;
    let transactionSvc: Pick<TransactionPort, "runInTransaction">;
    let realtimeSvc: Pick<RealtimePort, "emitToUser">;
    let txCommentRepo: Pick<
        ICommentRepository,
        "findById" | "hasUserLiked" | "addLike" | "incrementLikeCount"
    >;
    let txNotificationRepo: Pick<INotificationRepository, "create">;

    const input = { commentId: "comment-1", userId: "user-1" };

    const buildTransactionContext = (): TransactionContext =>
        ({
            commentRepository: txCommentRepo as ICommentRepository,
            notificationRepository:
                txNotificationRepo as INotificationRepository,
        }) as TransactionContext;

    beforeEach(() => {
        txCommentRepo = {
            findById: vi.fn(),
            hasUserLiked: vi.fn(),
            addLike: vi.fn(),
            incrementLikeCount: vi.fn(),
        };
        txNotificationRepo = { create: vi.fn() };
        realtimeSvc = { emitToUser: vi.fn() };
        transactionSvc = { runInTransaction: vi.fn() };

        vi.mocked(transactionSvc.runInTransaction).mockImplementation(
            async (work) => work(buildTransactionContext()),
        );

        useCase = new LikeCommentUseCase(
            transactionSvc as TransactionPort,
            realtimeSvc as RealtimePort,
        );
    });

    it("should throw NotFoundError when comment does not exist", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it("should do nothing when comment is already liked (idempotent)", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(buildComment());
        vi.mocked(txCommentRepo.hasUserLiked).mockResolvedValue(true);

        await useCase.execute(input);

        expect(txCommentRepo.addLike).not.toHaveBeenCalled();
        expect(txCommentRepo.incrementLikeCount).not.toHaveBeenCalled();
        expect(txNotificationRepo.create).not.toHaveBeenCalled();
    });

    it("should add like and increment count", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(
            buildComment({ authorId: "user-1" }),
        );
        vi.mocked(txCommentRepo.hasUserLiked).mockResolvedValue(false);
        vi.mocked(txCommentRepo.addLike).mockResolvedValue(undefined);
        vi.mocked(txCommentRepo.incrementLikeCount).mockResolvedValue(
            undefined,
        );

        await useCase.execute(input);

        expect(txCommentRepo.addLike).toHaveBeenCalledWith(
            "comment-1",
            "user-1",
        );
        expect(txCommentRepo.incrementLikeCount).toHaveBeenCalledWith(
            "comment-1",
        );
    });

    it("should not notify when user likes their own comment", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(
            buildComment({ authorId: "user-1" }),
        );
        vi.mocked(txCommentRepo.hasUserLiked).mockResolvedValue(false);
        vi.mocked(txCommentRepo.addLike).mockResolvedValue(undefined);
        vi.mocked(txCommentRepo.incrementLikeCount).mockResolvedValue(
            undefined,
        );

        await useCase.execute(input);

        expect(txNotificationRepo.create).not.toHaveBeenCalled();
        expect(realtimeSvc.emitToUser).not.toHaveBeenCalled();
    });

    it("should create notification and emit realtime event when liking another user's comment", async () => {
        vi.mocked(txCommentRepo.findById).mockResolvedValue(
            buildComment({ authorId: "comment-author", postId: "post-1" }),
        );
        vi.mocked(txCommentRepo.hasUserLiked).mockResolvedValue(false);
        vi.mocked(txCommentRepo.addLike).mockResolvedValue(undefined);
        vi.mocked(txCommentRepo.incrementLikeCount).mockResolvedValue(
            undefined,
        );

        await useCase.execute({ commentId: "comment-1", userId: "user-1" });

        expect(txNotificationRepo.create).toHaveBeenCalledOnce();
        expect(realtimeSvc.emitToUser).toHaveBeenCalledWith(
            "comment-author",
            "new-notification",
            expect.objectContaining({
                type: "COMMENT_LIKE",
                issuerId: "user-1",
                commentId: "comment-1",
                postId: "post-1",
            }),
        );
    });
});
