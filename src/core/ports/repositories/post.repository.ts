import type { PostType } from "@core/domain/enums/post-type.enum";
import type { Post } from "@core/domain/entities/post.entity";

/**
 * Parameters for paginated post retrieval with optional filtering.
 */
export interface GetPostsParams {
    page: number;
    limit: number;
    type?: PostType;
}

/**
 * Repository interface for managing Post entities.
 * Following Clean Architecture principles, this interface defines the contract
 * for persisting and retrieving Post domain entities without exposing
 * implementation details or DTOs.
 */
export interface IPostRepository {
    /**
     * Creates a new post entity in the persistence layer.
     * @param post - The Post entity to be created.
     */
    create(post: Post): Promise<void>;

    /**
     * Retrieves a paginated list of posts with optional type filtering.
     * @param params - Pagination and filtering parameters.
     * @returns An object containing the posts array and total count.
     */
    findAll(params: GetPostsParams): Promise<{ posts: Post[]; total: number }>;

    /**
     * Retrieves a post by its unique identifier.
     * @param id - The unique identifier of the post.
     * @returns The Post entity if found, otherwise null.
     */
    findById(id: string): Promise<Post | null>;

    /**
     * Deletes a post by its unique identifier.
     * @param id - The unique identifier of the post to be deleted.
     */
    delete(id: string): Promise<void>;
}
