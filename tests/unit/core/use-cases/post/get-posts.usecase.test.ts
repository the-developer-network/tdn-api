import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetPostsUseCase } from "@core/use-cases/post/get-posts";
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { CachePort } from "@core/ports/services/cache.port";
import type { IFollowRepository } from "@core/ports/repositories/follow.repository";
import { UnauthorizedError } from "@core/errors";
import { buildPost } from "../../../helpers/mock-factories";

describe("GetPostsUseCase", () => {
    let useCase: GetPostsUseCase;
    let postRepository: Pick<IPostRepository, "findAll">;
    let cacheService: Pick<CachePort, "get" | "set">;
    let followRepository: Pick<IFollowRepository, "getFollowingIds">;

    beforeEach(() => {
        postRepository = {
            findAll: vi.fn().mockResolvedValue({ posts: [], total: 0 }),
        };
        cacheService = {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(undefined),
        };
        followRepository = {
            getFollowingIds: vi.fn().mockResolvedValue([]),
        };
        useCase = new GetPostsUseCase(
            postRepository as IPostRepository,
            cacheService as CachePort,
            followRepository as IFollowRepository,
        );
    });

    it("should return posts from repository on cache miss", async () => {
        const posts = [buildPost()];
        vi.mocked(postRepository.findAll).mockResolvedValue({
            posts,
            total: 1,
        });

        const result = await useCase.execute({ page: 1, limit: 10 });

        expect(result.posts).toBe(posts);
        expect(result.total).toBe(1);
    });

    it("should throw UnauthorizedError when followedOnly=true but no userId", async () => {
        await expect(useCase.execute({ followedOnly: true })).rejects.toThrow(
            UnauthorizedError,
        );
    });

    it("should fetch followingIds when followedOnly=true and userId provided", async () => {
        vi.mocked(followRepository.getFollowingIds).mockResolvedValue([
            "user-2",
            "user-3",
        ]);
        vi.mocked(postRepository.findAll).mockResolvedValue({
            posts: [],
            total: 0,
        });

        await useCase.execute({
            followedOnly: true,
            currentUserId: "user-1",
        });

        expect(followRepository.getFollowingIds).toHaveBeenCalledWith("user-1");
        expect(postRepository.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                followingIds: ["user-2", "user-3"],
            }),
        );
    });

    it("should build correct cache key from all params", async () => {
        await useCase.execute({
            page: 2,
            limit: 5,
            currentUserId: "user-1",
        });

        expect(cacheService.get).toHaveBeenCalledWith(
            "posts:feed:page:2:limit:5:type:ALL:tag:ALL:categories:ALL:followedOnly:false:user:user-1",
        );
    });

    it("should store result in cache with 60-second TTL", async () => {
        const posts = [buildPost()];
        vi.mocked(postRepository.findAll).mockResolvedValue({
            posts,
            total: 1,
        });

        await useCase.execute({ page: 1, limit: 10 });

        expect(cacheService.set).toHaveBeenCalledWith(
            expect.stringContaining("posts:feed:"),
            expect.any(String),
            60,
        );
    });

    it("should return cached posts on cache hit", async () => {
        const post = buildPost();
        const cached = JSON.stringify({
            posts: [
                {
                    id: post.id,
                    content: post.content,
                    type: post.type,
                    mediaUrls: post.mediaUrls,
                    author: post.author,
                    tags: post.tags,
                    categories: post.categories,
                    createdAt: post.createdAt.toISOString(),
                    updatedAt: post.updatedAt.toISOString(),
                },
            ],
            total: 1,
        });
        vi.mocked(cacheService.get).mockResolvedValue(cached);

        const result = await useCase.execute({ page: 1, limit: 10 });

        expect(result.total).toBe(1);
        expect(result.posts).toHaveLength(1);
        expect(postRepository.findAll).not.toHaveBeenCalled();
    });
});
