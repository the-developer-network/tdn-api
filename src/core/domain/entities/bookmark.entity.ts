/**
 * Bookmark entity representing a user's bookmarked post
 */
import type { BookmarkProps } from "../interfaces/bookmark-props.interface";

export class Bookmark {
    /**
     * Creates a new Bookmark entity
     * @param props - The bookmark properties
     */
    constructor(private readonly props: BookmarkProps) {}

    /**
     * Creates a new bookmark instance
     * @param postId - The ID of the bookmarked post
     * @param userId - The ID of the user who bookmarked the post
     * @returns A new Bookmark instance
     */
    static create(postId: string, userId: string): Bookmark {
        return new Bookmark({ postId, userId });
    }
}
