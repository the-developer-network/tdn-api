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
import { mapPostTypeToCategory } from "@infrastructure/persistence/repositories/prisma-tag.repository";
import type { Prisma } from "@generated/prisma/client";

/**
 * Prisma implementation of the Post repository
 *
 * Provides database operations for Post entities using Prisma ORM.
 * Implements the IPostRepository interface to ensure consistent
 * data access patterns across different persistence implementations.
 */
export class PrismaPostRepository implements IPostRepository {
    constructor(private readonly prisma: PrismaTransactionalClient) {}

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
                            category: mapPostTypeToCategory(
                                post.type as PostType,
                            ),
                        },
                    })),
                },
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { avatarUrl: true } },
                    },
                },
                tags: true,
                likes: false,
                bookmarks: false,
            },
        });

        return PostPrismaMapper.toDomainPost(createdRaw as PostWithRelations);
    }

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
        } = params;
        const skip = (page - 1) * limit;

        const whereCondition = {
            ...(type ? { type } : {}),
            ...(authorId ? { authorId } : {}),
            ...(savedByUserId
                ? { bookmarks: { some: { userId: savedByUserId } } }
                : {}),
            ...(tag ? { tags: { some: { name: tag.toLowerCase() } } } : {}),
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

    async findById(id: string, currentUserId?: string): Promise<Post | null> {
        const raw = await this.prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { avatarUrl: true } },
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

    async delete(id: string): Promise<void> {
        await this.prisma.post.delete({
            where: { id },
        });
    }

    async incrementCommentsCount(postId: string): Promise<void> {
        await this.prisma.post.update({
            where: { id: postId },
            data: { commentCount: { increment: 1 } },
        });
    }

    async decrementCommentsCount(postId: string): Promise<void> {
        await this.prisma.post.update({
            where: { id: postId },
            data: { commentCount: { decrement: 1 } },
        });
    }

    async findByAuthorUsername(
        username: string,
        page: number,
        limit: number,
        type?: string,
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

        const [rawPosts, total] = await this.prisma.$transaction([
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
                            profile: { select: { avatarUrl: true } },
                        },
                    },
                    tags: true,
                    likes: false,
                    bookmarks: false,
                },
            }),
            this.prisma.post.count({ where: whereClause }),
        ]);

        const posts = rawPosts.map((raw) =>
            PostPrismaMapper.toDomainPost(raw as PostWithRelations),
        );

        return { posts, total };
    }
}
