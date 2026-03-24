/**
 * Input interface for retrieving bookmarked posts
 */
export interface GetBookmarksUseCaseInput {
    /** The ID of the user whose bookmarks to retrieve */
    userId: string;
    /** Page number for pagination (default: 1) */
    page?: number;
    /** Number of posts per page (default: 10) */
    limit?: number;
}
