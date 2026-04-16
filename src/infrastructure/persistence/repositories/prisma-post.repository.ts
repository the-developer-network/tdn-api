import type {
    IPostRepository,
    GetPostsParams,
} from "@core/ports/repositories/post.repository";
import type { Post } from "@core/domain/entities/post.entity";
import {
    PostPrismaMapper,
    type PostWithRelations,
} from "@infrastructure/persistence/mappers/post-prisma.mapper";
import type { PostType } from "@core/domain/enums/post-type.enum";
import type { PrismaTransactionalClient } from "@infrastructure/persistence/database/prisma-client.type";
import type { Prisma } from "@generated/prisma/client";

/**
 * Prisma implementation of the Post repository
 *
 * Provides database operations for Post entities using Prisma ORM.
 * Implements the IPostRepository interface to ensure consistent
 * data access patterns across different persistence implementations.
 */
export class PrismaPostRepository implements IPostRepository {
    /**
     * Constructor for PrismaPostRepository
     * @param prisma - An instance of PrismaTransactionalClient for database access
     */
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    /**
     * Creates a new post in the database.
     * Extracts hashtags from the post content and ensures they are stored in the database,
     * associating them with the post. Uses connectOrCreate to avoid duplicate tags.
     * @param post - The Post entity to be created
     * @returns The created Post entity with relations loaded
     */
    async create(post: Post): Promise<Post> {
        const hashtagRegex = /#[\p{L}\p{N}_]+/gu;
        const matches = post.content.match(hashtagRegex) || [];
        const uniqueTags = [
            ...new Set(
                matches.map((tag: string) => tag.slice(1).toLowerCase()),
            ),
        ];

        const prismaData = PostPrismaMapper.toPrismaPost(post);

        const createdRaw = await this.prisma.post.create({
            data: {
                ...prismaData,
                tags: {
                    connectOrCreate: uniqueTags.map((tag: string) => ({
                        where: { name: tag },
                        create: {
                            name: tag,
                        },
                    })),
                },
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: { avatarUrl: true, fullName: true },
                        },
                    },
                },
                tags: true,
                likes: false,
                bookmarks: false,
            },
        });

        return PostPrismaMapper.toDomainPost(createdRaw as PostWithRelations);
    }

    /**
     * Finds posts with pagination and optional filtering by type, author, savedByUserId, tag, followingIds, and categories.
     * Supports sorting by creation date or by like and comment count when filtering by tag.
     * @param params - Parameters for paginated post retrieval with optional filtering.
     * @returns An object containing the array of Post entities and the total count of posts matching the criteria.
     */
    async findAll(
        params: GetPostsParams,
    ): Promise<{ posts: Post[]; total: number }> {
        const {
            page,
            limit,
            type,
            authorId,
            savedByUserId,
            currentUserId,
            tag,
            followingIds,
        } = params;
        const skip = (page - 1) * limit;

        const whereCondition = {
            ...(type ? { type } : {}),
            ...(followingIds
                ? { authorId: { in: followingIds } }
                : authorId
                  ? { authorId }
                  : {}),
            ...(savedByUserId
                ? { bookmarks: { some: { userId: savedByUserId } } }
                : {}),
            ...(tag ? { tags: { some: { name: tag.toLowerCase() } } } : {}),
            ...(params.categories && params.categories.length > 0
                ? { category: { hasSome: params.categories } }
                : {}),
        };

        const orderBy = tag
            ? [
                  { likeCount: "desc" as const },
                  { commentCount: "desc" as const },
              ]
            : { createdAt: "desc" as const };

        const [total, rawPosts] = await Promise.all([
            this.prisma.post.count({ where: whereCondition }),
            this.prisma.post.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy,

                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            profile: {
                                select: { avatarUrl: true, fullName: true },
                            },
                        },
                    },
                    tags: true,
                    likes: currentUserId
                        ? { where: { userId: currentUserId } }
                        : false,
                    bookmarks: currentUserId
                        ? { where: { userId: currentUserId } }
                        : false,
                },
            }),
        ]);

        const posts = rawPosts.map((post) =>
            PostPrismaMapper.toDomainPost(post as PostWithRelations),
        );

        return { posts, total };
    }

    /**
     * Finds a post by its unique identifier, optionally including like and bookmark information for the current user.
     * @param id - The unique identifier of the post.
     * @param currentUserId - Optional ID of the current user to determine if they have liked or bookmarked the post.
     * @returns The Post entity if found, otherwise null.
     */
    async findById(id: string, currentUserId?: string): Promise<Post | null> {
        const raw = await this.prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: { avatarUrl: true, fullName: true },
                        },
                    },
                },
                tags: true,
                likes: currentUserId
                    ? { where: { userId: currentUserId } }
                    : false,
                bookmarks: currentUserId
                    ? { where: { userId: currentUserId } }
                    : false,
            },
        });

        if (!raw) return null;

        return PostPrismaMapper.toDomainPost(raw as PostWithRelations);
    }

    /**
     * Deletes a post by its unique identifier.
     * @param id - The unique identifier of the post to be deleted.
     * @returns A promise that resolves when the deletion is complete.
     */
    async delete(id: string): Promise<void> {
        await this.prisma.post.delete({
            where: { id },
        });
    }

    /**
     * Increments the comment count for a post by its unique identifier.
     * @param postId - The unique identifier of the post for which to increment the comment count.
     * @returns A promise that resolves when the update is complete.
     */
    async incrementCommentsCount(postId: string): Promise<void> {
        await this.prisma.post.update({
            where: { id: postId },
            data: { commentCount: { increment: 1 } },
        });
    }

    /**
     * Decrements the comment count for a post by its unique identifier.
     * @param postId - The unique identifier of the post for which to decrement the comment count.
     * @returns A promise that resolves when the update is complete.
     */
    async decrementCommentsCount(postId: string): Promise<void> {
        await this.prisma.post.update({
            where: { id: postId },
            data: { commentCount: { decrement: 1 } },
        });
    }

    /**
     * Finds posts by the author's username with pagination and optional type filtering.
     * @param username - The username of the author whose posts are being retrieved.
     * @param page - The page number for pagination.
     * @param limit - The number of posts to retrieve per page.
     * @param type - Optional filter to retrieve posts of a specific type.
     * @param currentUserId - Optional ID of the current user to determine if they have liked or bookmarked the posts.
     * @returns An object containing the array of Post entities and the total count of posts matching the criteria.
     */
    async findByAuthorUsername(
        username: string,
        page: number,
        limit: number,
        type?: string,
        currentUserId?: string,
    ): Promise<{ posts: Post[]; total: number }> {
        const skip = (page - 1) * limit;

        const whereClause: Prisma.PostWhereInput = {
            author: {
                username: username,
            },
        };

        if (type) {
            whereClause.type = type as PostType;
        }

        const [total, rawPosts] = await Promise.all([
            this.prisma.post.count({ where: whereClause }),
            this.prisma.post.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            profile: {
                                select: { avatarUrl: true, fullName: true },
                            },
                        },
                    },
                    tags: true,
                    likes: currentUserId
                        ? { where: { userId: currentUserId } }
                        : false,
                    bookmarks: currentUserId
                        ? { where: { userId: currentUserId } }
                        : false,
                },
            }),
        ]);

        const posts = rawPosts.map((raw) =>
            PostPrismaMapper.toDomainPost(raw as PostWithRelations),
        );

        return { posts, total };
    }

    /**
     * Counts total posts by a specific user.
     * @param userId - The ID of the user whose posts are being counted.
     * @returns The total number of posts by the user.
     */
    async countByUserId(userId: string): Promise<number> {
        return this.prisma.post.count({ where: { authorId: userId } });
    }
}
