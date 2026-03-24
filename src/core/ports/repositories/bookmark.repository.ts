/**
 * Repository interface for bookmark operations
 */
export interface IBookmarkRepository {
    /**
     * Saves a bookmark for a post by a user
     * @param postId - The ID of the post to bookmark
     * @param userId - The ID of the user creating the bookmark
     * @returns Promise that resolves when the bookmark is saved
     */
    save(postId: string, userId: string): Promise<void>;

    /**
     * Removes a bookmark for a post by a user
     * @param postId - The ID of the post to unbookmark
     * @param userId - The ID of the user removing the bookmark
     * @returns Promise that resolves when the bookmark is removed
     */
    remove(postId: string, userId: string): Promise<void>;

    /**
     * Checks if a post is bookmarked by a user
     * @param postId - The ID of the post to check
     * @param userId - The ID of the user to check for
     * @returns Promise that resolves to true if bookmarked, false otherwise
     */
    isBookmarked(postId: string, userId: string): Promise<boolean>;
}
