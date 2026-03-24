import type { PrismaClient } from "@generated/prisma/client";

import type {
    IPostRepository,
    GetPostsParams,
} from "@core/ports/repositories/post.repository";
import { Post } from "@core/domain/entities/post.entity";
import { PostPrismaMapper } from "@infrastructure/persistence/mappers/post-prisma.mapper";
import type { PostType } from "@core/domain/enums/post-type.enum";

export class PrismaPostRepository implements IPostRepository {
    constructor(private readonly prisma: PrismaClient) {}

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
            });
        });

        return { posts, total };
    }

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
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.post.delete({
            where: { id },
        });
    }
}
