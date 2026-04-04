import type { TransactionPort } from "@core/ports/services/transaction.port";
import type { CachePort } from "@core/ports/services/cache.port";
import { NotFoundError, ForbiddenError } from "@core/errors";
import type { DeleteCommentInput } from "./delete-comment-usecase.input";

export class DeleteCommentUseCase {
    constructor(
        private readonly transactionService: TransactionPort,
        private readonly cacheService: CachePort,
    ) {}

    async execute(input: DeleteCommentInput): Promise<void> {
        await this.transactionService.runInTransaction(async (ctx) => {
            const comment = await ctx.commentRepository.findById(
                input.commentId,
            );

            if (!comment) {
                throw new NotFoundError("Comment not found.");
            }

            if (comment.authorId !== input.userId) {
                throw new ForbiddenError("This comment is not yours.");
            }

            if (comment.parentId) {
                await ctx.commentRepository.decrementRepliesCount(
                    comment.parentId,
                );
            }

            await ctx.commentRepository.delete(input.commentId);

            await ctx.postRepository.decrementCommentsCount(comment.postId);
        });

        // 4. Cache temizliği
        await this.cacheService.deleteByPattern("posts:feed:*");
    }
}
