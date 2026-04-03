import { NotFoundError } from "@core/errors";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { ICommentBookmarkRepository } from "@core/ports/repositories/comment-bookmark.repository";
import type { RemoveCommentBookmarkInput } from "./remove-comment-bookmark.input";

export class RemoveCommentBookmarkUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly commentBookmarkRepository: ICommentBookmarkRepository,
    ) {}

    async execute(input: RemoveCommentBookmarkInput): Promise<void> {
        const comment = await this.commentRepository.findById(input.commentId);
        if (!comment) {
            throw new NotFoundError("Comment not found.");
        }

        const hasBookmark = await this.commentBookmarkRepository.isBookmarked(
            input.commentId,
            input.userId,
        );

        if (hasBookmark) {
            await this.commentBookmarkRepository.remove(
                input.commentId,
                input.userId,
            );
        }
    }
}
