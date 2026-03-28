import type { TransactionPort } from "@core/ports/services/transaction.port";
import { NotFoundError } from "@core/errors";

export class UnlikeCommentUseCase {
    constructor(private readonly transactionService: TransactionPort) {}

    async execute(input: { commentId: string; userId: string }): Promise<void> {
        await this.transactionService.runInTransaction(async (ctx) => {
            const comment = await ctx.commentRepository.findById(
                input.commentId,
            );
            if (!comment) throw new NotFoundError("Comment not found.");

            const alreadyLiked = await ctx.commentRepository.hasUserLiked(
                input.commentId,
                input.userId,
            );
            if (!alreadyLiked) return;

            await ctx.commentRepository.removeLike(
                input.commentId,
                input.userId,
            );
            await ctx.commentRepository.decrementLikeCount(input.commentId);
        });
    }
}
