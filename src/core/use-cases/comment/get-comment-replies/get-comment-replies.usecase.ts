import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { Comment } from "@core/domain/entities/comment.entity";
import { NotFoundError } from "@core/errors";
import type { GetCommentRepliesInput } from "./get-comment-replies.input";

export class GetCommentRepliesUseCase {
    constructor(private readonly commentRepository: ICommentRepository) {}

    async execute(input: GetCommentRepliesInput): Promise<Comment[]> {
        const page = input.page || 1;
        const limit = input.limit || 10;
        const offset = (page - 1) * limit;

        const parentComment = await this.commentRepository.findById(
            input.commentId,
        );

        if (!parentComment) {
            throw new NotFoundError("Comment not found.");
        }

        return this.commentRepository.findRepliesByParentId(
            input.commentId,
            limit,
            offset,
            input.currentUserId,
        );
    }
}
