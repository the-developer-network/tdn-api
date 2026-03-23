import type {
    PrismaClient,
    PostType as PrismaPostType,
} from "@generated/prisma/client";

import type {
    PostType,
    IPostRepository,
    CreatePostInput,
    GetPostsParams,
    PaginatedPosts,
    PostOutput,
} from "@core/ports/repositories/post.repository";

export class PrismaPostRepository implements IPostRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(data: CreatePostInput): Promise<void> {
        const hashtagRegex = /#[\p{L}\p{N}_]+/gu;
        const matches = data.content.match(hashtagRegex) || [];
        const uniqueTags = [
            ...new Set(matches.map((tag) => tag.slice(1).toLowerCase())),
        ];

        await this.prisma.post.create({
            data: {
                content: data.content,
                type: data.type as PrismaPostType,
                mediaUrls: data.mediaUrls || [],
                authorId: data.authorId,
                tags: {
                    connectOrCreate: uniqueTags.map((tag) => ({
                        where: { name: tag },
                        create: { name: tag },
                    })),
                },
            },
        });
    }

    async findAll(params: GetPostsParams): Promise<PaginatedPosts> {
        const { page, limit, type } = params;
        const skip = (page - 1) * limit;

        const whereCondition = type ? { type: type as PrismaPostType } : {};

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

        const posts: PostOutput[] = rawPosts.map((post) => {
            return {
                id: post.id,
                content: post.content,
                type: post.type as unknown as PostType,
                mediaUrls: post.mediaUrls,
                author: {
                    id: post.author.id,
                    username: post.author.username,
                    avatarUrl: post.author.profile?.avatarUrl as string,
                },
                tags: post.tags.map((tag) => tag.name),
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
            };
        });

        return { posts, total };
    }

    async findById(id: string): Promise<PostOutput | null> {
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

        return {
            id: post.id,
            content: post.content,
            type: post.type as unknown as PostType,
            mediaUrls: post.mediaUrls,
            author: {
                id: post.author.id,
                username: post.author.username,
                avatarUrl: post.author.profile?.avatarUrl as string,
            },
            tags: post.tags.map((tag) => tag.name),
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        };
    }

    async delete(id: string): Promise<void> {
        await this.prisma.post.delete({
            where: { id },
        });
    }
}
