/**
 * Input interface for removing a bookmark
 */
export interface RemoveBookmarkInput {
    /** The ID of the post to unbookmark */
    postId: string;
    /** The ID of the user removing the bookmark */
    userId: string;
}
