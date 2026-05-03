/**
 * Bookmark entity representing a user's bookmarked post
 */
import type { BookmarkProps } from "../interfaces/bookmark-props.interface";

export class Bookmark {
    private constructor(private readonly props: BookmarkProps) {}

    public static create(postId: string, userId: string): Bookmark {
        return new Bookmark({ postId, userId });
    }

    public static with(props: BookmarkProps): Bookmark {
        return new Bookmark(props);
    }
}
