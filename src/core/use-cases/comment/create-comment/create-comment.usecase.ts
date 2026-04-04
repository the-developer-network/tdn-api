/**
 * Use case for creating comments on posts
 * Handles comment creation, notification generation, and post comment count updates
 */
import type { TransactionPort } from "@core/ports/services/transaction.port";
import type { RealtimePort } from "@core/ports/services/realtime.port";
import { Comment } from "@core/domain/entities/comment.entity";
import { Notification } from "@core/domain/entities/notification.entity";
import { NotificationType } from "@core/domain/enums/notification-type.enum";
import { NotFoundError, BadRequestError } from "@core/errors";
import type { CreateCommentUseCaseInput } from "./create-comment-usecase.input";

export class CreateCommentUseCase {
    /**
     * Creates a new CreateCommentUseCase instance
     * @param transactionService - Service for handling database transactions
     * @param realtimeService - Service for sending real-time notifications
     */
    constructor(
        private readonly transactionService: TransactionPort,
        private readonly realtimeService: RealtimePort,
    ) {}

    /**
     * Executes the comment creation use case
     * @param input - Input data containing comment content, post ID, author ID, and optional parent comment ID
     * @returns Promise that resolves with the created Comment entity
     * @throws NotFoundError if the post or parent comment is not found
     * @throws BadRequestError if the parent comment belongs to a different post
     */
    async execute(input: CreateCommentUseCaseInput): Promise<Comment> {
        return await this.transactionService.runInTransaction(async (ctx) => {
            const post = await ctx.postRepository.findById(input.postId);
            if (!post) throw new NotFoundError("Post not found.");

            let notifyUserId: string | null = null;

            if (input.parentId) {
                const parentComment = await ctx.commentRepository.findById(
                    input.parentId,
                );
                if (!parentComment) {
                    throw new NotFoundError("Parent comment not found.");
                }

                if (parentComment.postId !== input.postId) {
                    throw new BadRequestError(
                        "Parent comment belongs to a different post.",
                    );
                }

                if (parentComment.authorId !== input.authorId) {
                    notifyUserId = parentComment.authorId;
                }
            } else {
                if (post.author.id !== input.authorId) {
                    notifyUserId = post.author.id;
                }
            }

            const tempComment = Comment.create(
                input.content,
                input.postId,
                input.authorId,
                input.parentId,
                input.mediaUrls || [],
            );

            const savedComment =
                await ctx.commentRepository.create(tempComment);

            await ctx.postRepository.incrementCommentsCount(input.postId);

            if (input.parentId) {
                await ctx.commentRepository.incrementRepliesCount(
                    input.parentId,
                );
            }

            if (notifyUserId) {
                const notification = Notification.create(
                    notifyUserId,
                    input.authorId,
                    NotificationType.COMMENT,
                );

                await ctx.notificationRepository.create(notification);

                this.realtimeService.emitToUser(
                    notifyUserId,
                    "new-notification",
                    {
                        type: NotificationType.COMMENT,
                        issuerId: input.authorId,
                        postId: input.postId,
                    },
                );
            }

            return savedComment;
        });
    }
}
