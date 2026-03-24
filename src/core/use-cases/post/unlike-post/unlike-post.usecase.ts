import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { IPostLikeRepository } from "@core/ports/repositories/post-like.repository";
import { NotFoundError } from "@core/errors";
import type { UnlikePostUseCaseInput } from "./unlike-post-usecase.input";

/**
 * Use case for unliking a post
 *
 * Handles the business logic for removing a like relationship between a user and a post.
 * Validates that the post exists and that the user has previously liked the post before
 * removing the like relationship.
 */
export class UnlikePostUseCase {
    /**
     * Creates a new UnlikePostUseCase instance
     * @param postRepository - Repository for post data operations
     * @param postLikeRepository - Repository for post like relationships
     */
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly postLikeRepository: IPostLikeRepository,
    ) {}

    /**
     * Executes the unlike post use case
     * @param input - Input containing post ID and user ID
     * @returns Promise<void>
     *
     * @throws NotFoundError - When the post is not found
     *
     * @remarks
     * This method first validates that the post exists, then checks if the user
     * has previously liked the post. If both conditions are met, it removes the
     * like relationship. If the user hasn't liked the post, the operation is
     * silently ignored (no error thrown).
     */
    async execute(input: UnlikePostUseCaseInput): Promise<void> {
        const post = await this.postRepository.findById(input.postId);

        if (!post) {
            throw new NotFoundError("Post not found.");
        }

        const hasLiked = await this.postLikeRepository.isLiked(
            input.postId,
            input.userId,
        );

        if (hasLiked) {
            await this.postLikeRepository.unlike(input.postId, input.userId);
        }
    }
}
