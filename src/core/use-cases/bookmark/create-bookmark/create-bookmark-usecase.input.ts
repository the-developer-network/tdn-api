/**
 * Input interface for creating a bookmark
 */
export interface CreateBookmarkInput {
    /** The ID of the post to bookmark */
    postId: string;
    /** The ID of the user creating the bookmark */
    userId: string;
}
