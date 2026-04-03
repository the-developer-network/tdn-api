import { NotFoundError } from "@core/errors";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { ICommentBookmarkRepository } from "@core/ports/repositories/comment-bookmark.repository";
import type { SaveCommentBookmarkInput } from "./save-comment-bookmark.input";

export class SaveCommentBookmarkUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly commentBookmarkRepository: ICommentBookmarkRepository,
    ) {}

    async execute(input: SaveCommentBookmarkInput): Promise<void> {
        const comment = await this.commentRepository.findById(input.commentId);
        if (!comment) {
            throw new NotFoundError("Comment not found.");
        }

        const alreadyBookmarked =
            await this.commentBookmarkRepository.isBookmarked(
                input.commentId,
                input.userId,
            );

        if (alreadyBookmarked) return;

        await this.commentBookmarkRepository.save(
            input.commentId,
            input.userId,
        );
    }
}
