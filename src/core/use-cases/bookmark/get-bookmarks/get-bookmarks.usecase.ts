/**
 * Use case for retrieving a user's bookmarked posts
 */
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { GetBookmarksUseCaseInput } from "./get-bookmarks-usecase.input";
import type { Post } from "@core/domain/entities/post.entity";

export class GetBookmarksUseCase {
    /**
     * Creates a new GetBookmarksUseCase instance
     * @param postRepository - Repository for post operations
     */
    constructor(private readonly postRepository: IPostRepository) {}

    /**
     * Executes the process of fetching saved posts
     * @param input - Contains userId and pagination options
     * @returns Paginated posts and total count
     */
    async execute(
        input: GetBookmarksUseCaseInput,
    ): Promise<{ posts: Post[]; total: number }> {
        const page = input.page || 1;
        const limit = input.limit || 10;

        const { posts, total } = await this.postRepository.findAll({
            page,
            limit,
            savedByUserId: input.userId,
            currentUserId: input.userId,
        });

        return { posts, total };
    }
}
