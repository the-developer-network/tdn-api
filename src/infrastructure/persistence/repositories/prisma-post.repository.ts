import type {
    IPostRepository,
    GetPostsParams,
} from "@core/ports/repositories/post.repository";
import { Post } from "@core/domain/entities/post.entity";
import { PostPrismaMapper } from "@infrastructure/persistence/mappers/post-prisma.mapper";
import type { PostType } from "@core/domain/enums/post-type.enum";
import type { PrismaTransactionalClient } from "@infrastructure/persistence/database/prisma-client.type";

/**
 * Prisma implementation of the Post repository
 *
 * Provides database operations for Post entities using Prisma ORM.
 * Implements the IPostRepository interface to ensure consistent
 * data access patterns across different persistence implementations.
 */
export class PrismaPostRepository implements IPostRepository {
    /**
     * Creates a new PrismaPostRepository instance
     * @param prisma - The Prisma client instance
     */
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    /**
     * Creates a new post in the database
     * @param post - The Post entity to create
     * @returns Promise<void>
     */
    async create(post: Post): Promise<void> {
        const hashtagRegex = /#[\p{L}\p{N}_]+/gu;
        const matches = post.content.match(hashtagRegex) || [];
        const uniqueTags = [
            ...new Set(
                matches.map((tag: string) => tag.slice(1).toLowerCase()),
            ),
        ];

        const prismaData = PostPrismaMapper.toPrisma(post);

        await this.prisma.post.create({
            data: {
                ...prismaData,
                tags: {
                    connectOrCreate: uniqueTags.map((tag: string) => ({
                        where: { name: tag },
                        create: { name: tag },
                    })),
                },
            },
        });
    }

    /**
     * Retrieves a paginated list of posts with optional type filtering
     * @param params - Pagination and filtering parameters
     * @returns Promise containing posts array and total count
     */
    async findAll(
        params: GetPostsParams,
    ): Promise<{ posts: Post[]; total: number }> {
        const { page, limit, type } = params;
        const skip = (page - 1) * limit;

        const whereCondition = type ? { type } : {};

        const [total, rawPosts] = await Promise.all([
            this.prisma.post.count({ where: whereCondition }),
            this.prisma.post.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            profile: {
                                select: { avatarUrl: true },
                            },
                        },
                    },
                    tags: {
                        select: { name: true },
                    },
                    _count: {
                        select: { likes: true },
                    },
                },
            }),
        ]);

        const posts: Post[] = rawPosts.map((post) => {
            return new Post({
                id: post.id,
                content: post.content,
                type: post.type as PostType,
                mediaUrls: post.mediaUrls,
                author: {
                    id: post.author.id,
                    username: post.author.username,
                    avatarUrl: post.author.profile?.avatarUrl as string,
                },
                tags: post.tags.map((tag) => tag.name),
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                likeCount: post._count.likes,
                commentCount: post.commentCount,
            });
        });

        return { posts, total };
    }

    /**
     * Retrieves a post by its unique identifier
     * @param id - The unique identifier of the post
     * @returns Promise containing the Post entity or null if not found
     */
    async findById(id: string): Promise<Post | null> {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { avatarUrl: true } },
                    },
                },
                tags: { select: { name: true } },
                _count: {
                    select: { likes: true },
                },
            },
        });

        if (!post) return null;

        return new Post({
            id: post.id,
            content: post.content,
            type: post.type as PostType,
            mediaUrls: post.mediaUrls,
            author: {
                id: post.author.id,
                username: post.author.username,
                avatarUrl: post.author.profile?.avatarUrl as string,
            },
            tags: post.tags.map((tag) => tag.name),
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            likeCount: post._count.likes,
            commentCount: post.commentCount,
        });
    }

    /**
     * Deletes a post by its unique identifier
     * @param id - The unique identifier of the post to delete
     * @returns Promise<void>
     */
    async delete(id: string): Promise<void> {
        await this.prisma.post.delete({
            where: { id },
        });
    }

    /**
     * Increments the comment count for a post
     * @param postId - The ID of the post to increment comment count for
     * @returns Promise<void>
     */
    async incrementCommentsCount(postId: string): Promise<void> {
        await this.prisma.post.update({
            where: { id: postId },
            data: { commentCount: { increment: 1 } },
        });
    }

    /**
     * Decrements the comment count for a post
     * @param postId - The ID of the post to decrement comment count for
     * @returns Promise<void>
     */
    async decrementCommentsCount(postId: string): Promise<void> {
        await this.prisma.post.update({
            where: { id: postId },
            data: { commentCount: { decrement: 1 } },
        });
    }
}
