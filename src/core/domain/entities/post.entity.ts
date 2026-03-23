import type { PostType } from "@core/domain/enums/post-type.enum";

/**
 * Props interface for Post entity
 */
export interface PostProps {
    id?: string;
    content: string;
    type: PostType;
    mediaUrls: string[];
    author: {
        id: string;
        username?: string;
        avatarUrl?: string;
    };
    tags: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Input interface for creating a new Post entity
 * Excludes auto-generated fields (id, createdAt, updatedAt)
 */
export interface CreatePostInput {
    content: string;
    type: PostType;
    authorId: string;
    mediaUrls?: string[];
}

/**
 * Rich domain model for Post entity
 * Encapsulates both data and business logic related to posts
 */
export class Post {
    constructor(private readonly props: PostProps) {}

    /**
     * Creates a new Post entity with minimal required data.
     * @param content - The content of the post
     * @param type - The type of the post
     * @param authorId - The ID of the post author
     * @param mediaUrls - Optional array of media URLs
     * @returns A new Post entity
     */
    public static create(
        content: string,
        type: PostType,
        authorId: string,
        mediaUrls: string[] = [],
    ): Post {
        return new Post({
            content,
            type,
            mediaUrls,
            author: { id: authorId },
            tags: [],
        });
    }

    /**
     * Get the unique identifier of the post
     */
    get id(): string {
        return this.props.id!;
    }

    /**
     * Get the content of the post
     */
    get content(): string {
        return this.props.content;
    }

    /**
     * Get the type of the post
     */
    get type(): string {
        return this.props.type;
    }

    /**
     * Get the media URLs associated with the post
     */
    get mediaUrls(): string[] {
        return this.props.mediaUrls;
    }

    /**
     * Get the author information of the post
     */
    get author(): { id: string; username?: string; avatarUrl?: string } {
        return this.props.author;
    }

    /**
     * Get the tags associated with the post
     */
    get tags(): string[] {
        return this.props.tags;
    }

    /**
     * Get the creation date of the post
     */
    get createdAt(): Date {
        return this.props.createdAt!;
    }

    /**
     * Get the last update date of the post
     */
    get updatedAt(): Date {
        return this.props.updatedAt!;
    }

    /**
     * Check if the post has any media attached
     */
    public hasMedia(): boolean {
        return this.props.mediaUrls.length > 0;
    }

    /**
     * Check if the given user is the author of this post
     */
    public isAuthor(userId: string): boolean {
        return this.props.author.id === userId;
    }

    /**
     * Check if the post contains any tags
     */
    public hasTags(): boolean {
        return this.props.tags.length > 0;
    }

    /**
     * Get the number of media items attached to the post
     */
    public mediaCount(): number {
        return this.props.mediaUrls.length;
    }

    /**
     * Update the post content and mark as updated
     */
    public updateContent(newContent: string): void {
        this.props.content = newContent;
        this.props.updatedAt = new Date();
    }

    /**
     * Add a new media URL to the post
     */
    public addMedia(mediaUrl: string): void {
        this.props.mediaUrls.push(mediaUrl);
        this.props.updatedAt = new Date();
    }

    /**
     * Remove a media URL from the post
     */
    public removeMedia(mediaUrl: string): void {
        this.props.mediaUrls = this.props.mediaUrls.filter(
            (url) => url !== mediaUrl,
        );
        this.props.updatedAt = new Date();
    }

    /**
     * Add a tag to the post
     */
    public addTag(tag: string): void {
        if (!this.props.tags.includes(tag)) {
            this.props.tags.push(tag);
            this.props.updatedAt = new Date();
        }
    }

    /**
     * Remove a tag from the post
     */
    public removeTag(tag: string): void {
        this.props.tags = this.props.tags.filter((t) => t !== tag);
        this.props.updatedAt = new Date();
    }
}
