/**
 * Interface defining the properties of a comment entity
 * Supports nested comments through optional parent-child relationships
 */
export interface CommentProps {
    /**
     * Unique identifier of the comment (optional for new comments)
     */
    id?: string;

    /**
     * The text content of the comment
     */
    content: string;

    /**
     * ID of the post this comment belongs to
     */
    postId: string;

    /**
     * ID of the user who authored this comment
     */
    authorId: string;

    /**
     * ID of the parent comment if this is a nested comment
     * Null for top-level comments
     */
    parentId: string | null;

    /**
     * Creation timestamp of the comment (optional for new comments)
     */
    createdAt?: Date;

    /**
     * Last update timestamp of the comment (optional for new comments)
     */
    updatedAt?: Date;

    author?: {
        id: string;
        username?: string;
        avatarUrl?: string;
    };

    likeCount?: number;
    replyCount?: number;
    isLiked?: boolean;
}
