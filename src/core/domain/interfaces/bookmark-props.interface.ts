/**
 * Interface defining the properties of a bookmark
 */
export interface BookmarkProps {
    /** Unique identifier for the bookmark */
    id?: string;
    /** ID of the bookmarked post */
    postId: string;
    /** ID of the user who created the bookmark */
    userId: string;
    /** Creation timestamp of the bookmark */
    createdAt?: Date;
}
