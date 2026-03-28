/**
 * Repository interface for comment data operations
 * Handles CRUD operations for comments and nested comment relationships
 */
import type { Comment } from "@core/domain/entities/comment.entity";

export interface ICommentRepository {
    /**
     * Creates a new comment and increments the post's comment count
     * @param comment - The comment entity to create
     * @returns Promise that resolves when the comment is created
     */
    create(comment: Comment): Promise<Comment>;

    /**
     * Finds a comment by its unique identifier
     * @param id - The comment ID to search for
     * @returns Promise that resolves to the comment or null if not found
     */
    findById(id: string, currentUserId?: string): Promise<Comment | null>;

    /**
     * Retrieves top-level comments for a post (where parentId is null)
     * @param postId - The ID of the post to get comments for
     * @param limit - Maximum number of comments to return
     * @param offset - Number of comments to skip for pagination
     * @returns Promise that resolves to an array of top-level comments
     */
    findTopLevelByPostId(
        postId: string,
        limit: number,
        offset: number,
        currentUserId?: string,
    ): Promise<Comment[]>;

    /**
     * Retrieves replies for a specific parent comment
     * @param parentId - The ID of the parent comment
     * @param limit - Maximum number of replies to return
     * @param offset - Number of replies to skip for pagination
     * @returns Promise that resolves to an array of reply comments
     */
    findRepliesByParentId(
        parentId: string,
        limit: number,
        offset: number,
        currentUserId?: string,
    ): Promise<Comment[]>;

    /**
     * Deletes a comment and decrements the post's comment count
     * Note: Cascade will handle replies, but we need to decrement count
     * @param id - The ID of the comment to delete
     * @returns Promise that resolves when the comment is deleted
     */
    delete(id: string): Promise<void>;
    hasUserLiked(commentId: string, userId: string): Promise<boolean>;
    addLike(commentId: string, userId: string): Promise<void>;
    removeLike(commentId: string, userId: string): Promise<void>;
    incrementLikeCount(commentId: string): Promise<void>;
    decrementLikeCount(commentId: string): Promise<void>;
}
