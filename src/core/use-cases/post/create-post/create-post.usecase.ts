import { type IPostRepository } from "@core/ports/repositories/post.repository";
import type { CreatePostInput } from "./create-post-usecase.input";
import type { CachePort } from "@core/ports/services/cache.port";
import { Post } from "@core/domain/entities/post.entity";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import { PostType } from "@core/domain/enums";
import { ForbiddenError } from "@core/errors/common/forbidden.error";
import { NotFoundError } from "@core/errors/common/not-found.error";

/**
 * Use case for creating a new post.
 *
 * This use case handles the process of creating a post with optional media
 * and invalidating related cache entries.
 */
export class CreatePostUseCase {
    /**
     * Creates a new instance of CreatePostUseCase.
     *
     * @param postRepository - Repository for managing post data
     * @param cacheService - Service for cache operations
     */
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly cacheService: CachePort,
        private readonly userRepository: IUserRepository,
    ) {}

    /**
     * Executes the post creation process.
     *
     * @param input - Input containing post content, type, author ID, and media URLs
     * @returns Promise<void> - Resolves when post creation is complete
     *
     * @remarks
     * This method creates a new post entity, saves it to the database,
     * and clears any cached feed data to ensure consistency.
     */
    async execute(input: CreatePostInput): Promise<Post> {
        if ([PostType.SYSTEM_UPDATE, PostType.TECH_NEWS].includes(input.type)) {
            const author = await this.userRepository.findById(input.authorId);
            if (!author) throw new NotFoundError("User not found.");
            if (!author.canCreatePostType(input.type)) {
                throw new ForbiddenError(
                    "Only bot accounts can create this post type.",
                );
            }
        }
        const post = Post.create(
            input.content,
            input.type,
            input.authorId,
            input.mediaUrls || [],
        );

        const rawPost = await this.postRepository.create(post);
        await this.cacheService.deleteByPattern("posts:feed:*");

        return rawPost;
    }
}
