import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import { NotFoundError } from "@core/errors";
import type { Comment } from "@core/domain/entities/comment.entity";
import type { GetPostCommentsInput } from "./get-post-comments.input";

export class GetPostCommentsUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly postRepository: IPostRepository,
    ) {}

    async execute(input: GetPostCommentsInput): Promise<Comment[]> {
        const page = input.page || 1;
        const limit = input.limit || 10;
        const offset = (page - 1) * limit;

        const postExists = await this.postRepository.findById(input.postId);
        if (!postExists) {
            throw new NotFoundError(
                "The post was either not found or has been deleted.",
            );
        }

        const comments = await this.commentRepository.findTopLevelByPostId(
            input.postId,
            limit,
            offset,
            input.currentUserId,
        );

        return comments;
    }
}
