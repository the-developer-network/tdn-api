import type { TransactionPort } from "@core/ports/services/transaction.port";
import type { RealtimePort } from "@core/ports/services/realtime.port";
import { NotFoundError } from "@core/errors";
import { Notification } from "@core/domain/entities/notification.entity";
import { NotificationType } from "@core/domain/enums/notification-type.enum";

export class LikeCommentUseCase {
    constructor(
        private readonly transactionService: TransactionPort,
        private readonly realtimeService: RealtimePort,
    ) {}

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
            if (alreadyLiked) return;

            await ctx.commentRepository.addLike(input.commentId, input.userId);
            await ctx.commentRepository.incrementLikeCount(input.commentId);

            if (comment.authorId !== input.userId) {
                const notification = Notification.create(
                    comment.authorId,
                    input.userId,
                    NotificationType.COMMENT_LIKE,
                );

                await ctx.notificationRepository.create(notification);

                this.realtimeService.emitToUser(
                    comment.authorId,
                    "new-notification",
                    {
                        type: NotificationType.COMMENT_LIKE,
                        issuerId: input.userId,
                        commentId: input.commentId,
                        postId: comment.postId,
                    },
                );
            }
        });
    }
}
