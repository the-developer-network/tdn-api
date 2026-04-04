import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { Comment } from "@core/domain/entities/comment.entity";
import { NotFoundError } from "@core/errors";
import type { GetCommentInput } from "./get-comment.input";

export class GetCommentUseCase {
    constructor(private readonly commentRepository: ICommentRepository) {}

    async execute(input: GetCommentInput): Promise<Comment> {
        const comment = await this.commentRepository.findById(
            input.commentId,
            input.currentUserId,
        );

        if (!comment) {
            throw new NotFoundError("Comment not found.");
        }

        return comment;
    }
}
