import type { Post } from "@core/domain/entities/post.entity";
import type { PostType } from "@core/domain/enums/post-type.enum";

export class PostPrismaMapper {
    /**
     * Maps a Post entity to a response object
     * @param post - The Post entity
     * @returns A response object with post data
     */
    public static toPostOutput(post: Post): {
        id: string;
        content: string;
        type: PostType;
        mediaUrls: string[];
        author: {
            id: string;
            username: string;
            avatarUrl: string;
        };
        createdAt: Date;
        updatedAt: Date;
    } {
        return {
            id: post.id,
            content: post.content,
            type: post.type as PostType,
            mediaUrls: post.mediaUrls,
            author: {
                id: post.author.id,
                username: post.author.username || "",
                avatarUrl: post.author.avatarUrl || "",
            },
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        };
    }

    /**
     * Maps a Post entity to Prisma post data
     * @param post - The Post entity
     * @returns Prisma post data
     */
    public static toPrisma(post: Post): {
        content: string;
        type: PostType;
        mediaUrls: string[];
        authorId: string;
    } {
        return {
            content: post.content,
            type: post.type as PostType,
            mediaUrls: post.mediaUrls,
            authorId: post.author.id,
        };
    }
}
