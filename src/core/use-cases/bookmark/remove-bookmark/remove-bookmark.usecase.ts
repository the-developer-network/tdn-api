/**
 * Use case for removing a bookmark from a post
 */
import type { TransactionPort } from "@core/ports/services/transaction.port";
import { NotFoundError } from "@core/errors";
import type { RemoveBookmarkInput } from "./remove-bookmark-usecase.input";
import type { CachePort } from "@core/ports/services/cache.port";

export class RemoveBookmarkUseCase {
    /**
     * Creates a new RemoveBookmarkUseCase instance
     * @param transactionService - Transaction service for database operations
     */
    constructor(
        private readonly transactionService: TransactionPort,
        private readonly redisService: CachePort,
    ) {}

    /**
     * Executes the bookmark removal use case
     * @param input - Input containing post ID and user ID
     * @returns Promise that resolves when bookmark is removed
     * @throws NotFoundError if the post does not exist
     */
    async execute(input: RemoveBookmarkInput): Promise<void> {
        await this.transactionService.runInTransaction(async (ctx) => {
            const post = await ctx.postRepository.findById(input.postId);
            if (!post) {
                throw new NotFoundError("Post not found.");
            }

            const hasBookmark = await ctx.bookmarkRepository.isBookmarked(
                input.postId,
                input.userId,
            );

            if (hasBookmark) {
                await ctx.bookmarkRepository.remove(input.postId, input.userId);
            }
        });
        await this.redisService.deleteByPattern(
            `posts:feed:*user:${input.userId}*`,
        );
    }
}
