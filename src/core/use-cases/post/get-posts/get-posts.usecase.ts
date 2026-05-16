import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { IFollowRepository } from "@core/ports/repositories/follow.repository";
import type { CachePort } from "@core/ports/services/cache.port";
import type { GetPostsInput } from "./get-posts-usecase.input";
import type { GetPostsOutput } from "./get-posts-usecase.output";
import { Post } from "@core/domain/entities/post.entity";
import { UnauthorizedError } from "@core/errors";
import { PostType } from "@core/domain/enums";

interface CachedPostData {
    id: string;
    createdAt: string;
    updatedAt: string;
    props?: Record<string, unknown>;
    [key: string]: unknown;
}

interface CachedFeedData {
    posts: CachedPostData[];
    total: number;
}

function shufflePosts(posts: Post[]): Post[] {
    const shuffled = [...posts];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export class GetPostsUseCase {
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly cacheService: CachePort,
        private readonly followRepository: IFollowRepository,
    ) {}

    async execute(input: GetPostsInput): Promise<GetPostsOutput> {
        const page = input.page || 1;
        const limit = input.limit || 10;
        const typeStr = input.type || "ALL";
        const tagStr = input.tag ?? "ALL";
        const followedOnly = input.followedOnly ?? false;
        const categoriesStr =
            input.categories && input.categories.length > 0
                ? input.categories.join(",")
                : "ALL";

        if (followedOnly && !input.currentUserId) {
            throw new UnauthorizedError(
                "Authentication is required to use the followedOnly filter.",
            );
        }

        const cacheKey = `posts:feed:page:${page}:limit:${limit}:type:${typeStr}:tag:${tagStr}:categories:${categoriesStr}:followedOnly:${followedOnly}:user:${input.currentUserId || "guest"}`;

        const cachedData = await this.cacheService.get(cacheKey);

        if (cachedData) {
            const parsed = JSON.parse(cachedData) as CachedFeedData;

            const hydratedPosts = parsed.posts.map((p) => {
                const data = p.props || p;

                return Post.with({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...(data as any),
                    id: p.id || (data.id as string),
                    createdAt: new Date(data.createdAt as string),
                    updatedAt: new Date(data.updatedAt as string),
                });
            });

            return {
                posts: shufflePosts(hydratedPosts),
                total: parsed.total,
            };
        }

        const { posts, total } = await this.postRepository.findAll({
            page,
            limit,
            type: input.type,
            currentUserId: input.currentUserId,
            tag: input.tag,
            categories: input.categories,
            ...(followedOnly && input.currentUserId
                ? {
                      followingIds: await this.followRepository.getFollowingIds(
                          input.currentUserId,
                      ),
                  }
                : {}),
        });

        const response: GetPostsOutput = {
            posts,
            total,
        };

        await this.cacheService.set(cacheKey, JSON.stringify(response), 60);

        return {
            posts:
                input.type === PostType.COMMUNITY ? shufflePosts(posts) : posts,
            total,
        };
    }
}
