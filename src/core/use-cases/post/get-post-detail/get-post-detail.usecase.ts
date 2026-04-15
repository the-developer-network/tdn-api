import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { Post } from "@core/domain/entities/post.entity";
import { NotFoundError } from "@core/errors";
import type { GetPostDetailUseCaseInput } from "./get-post-detail-usecase.input";

/**
 * Use case for retrieving the details of a specific post. It takes a post ID and an optional user ID to determine if the user has access to the post. If the post is found, it returns the post details; otherwise, it throws a NotFoundError.
 */
export class GetPostDetailUseCase {
    /**
     * @param postRepository - An instance of IPostRepository to interact with the data layer for posts.
     */
    constructor(private readonly postRepository: IPostRepository) {}

    /**
     * Executes the use case to get the details of a post by its ID. If the post is not found, it throws a NotFoundError.
     * @param input - An object containing the input parameters for the use case.
     * @param input.postId - The ID of the post to retrieve.
     * @param input.userId - (Optional) The ID of the current user, used to determine access to the post.
     * @returns A promise that resolves to the post details if found, or rejects with a NotFoundError if not found.
     */
    async execute(input: GetPostDetailUseCaseInput): Promise<Post> {
        const { postId, userId } = input;
        const post = await this.postRepository.findById(postId, userId);

        if (!post) {
            throw new NotFoundError("Post not found");
        }

        return post;
    }
}
