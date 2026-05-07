import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeletePostUseCase } from "@core/use-cases/post/delete-post";
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { StoragePort } from "@core/ports/services/storage.port";
import type { LoggerPort } from "@core/ports/services/logger.port";
import type { CachePort } from "@core/ports/services/cache.port";
import { NotFoundError } from "@core/errors";
import { UnauthorizedActionError } from "@core/errors";
import { buildPost } from "../../../helpers/mock-factories";

describe("DeletePostUseCase", () => {
    let useCase: DeletePostUseCase;
    let postRepository: Pick<IPostRepository, "findById" | "delete">;
    let storageService: Pick<StoragePort, "delete">;
    let logger: LoggerPort;
    let cacheService: Pick<CachePort, "deleteByPattern">;

    beforeEach(() => {
        postRepository = {
            findById: vi.fn(),
            delete: vi.fn().mockResolvedValue(undefined),
        };
        storageService = {
            delete: vi.fn().mockResolvedValue(undefined),
        };
        logger = {
            error: vi.fn(),
        };
        cacheService = {
            deleteByPattern: vi.fn().mockResolvedValue(undefined),
        };
        useCase = new DeletePostUseCase(
            postRepository as IPostRepository,
            storageService as StoragePort,
            logger,
            cacheService as CachePort,
        );
    });

    it("should throw NotFoundError when post not found", async () => {
        vi.mocked(postRepository.findById).mockResolvedValue(null);

        await expect(
            useCase.execute({
                postId: "ghost-post",
                userId: "user-1",
                cdnBaseUrl: "https://cdn.example.com",
            }),
        ).rejects.toThrow(NotFoundError);
    });

    it("should throw UnauthorizedActionError when user is not the author", async () => {
        const post = buildPost({ author: { id: "author-1" } });
        vi.mocked(postRepository.findById).mockResolvedValue(post);

        await expect(
            useCase.execute({
                postId: "post-1",
                userId: "other-user",
                cdnBaseUrl: "https://cdn.example.com",
            }),
        ).rejects.toThrow(UnauthorizedActionError);
    });

    it("should delete post and invalidate cache", async () => {
        const post = buildPost({ author: { id: "user-1" } });
        vi.mocked(postRepository.findById).mockResolvedValue(post);

        await useCase.execute({
            postId: "post-1",
            userId: "user-1",
            cdnBaseUrl: "https://cdn.example.com",
        });

        expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
            "posts:feed:*",
        );
        expect(postRepository.delete).toHaveBeenCalledWith("post-1");
    });

    it("should delete media files when post has media", async () => {
        const post = buildPost({
            author: { id: "user-1" },
            mediaUrls: ["https://cdn.example.com/posts/user-1/img.jpg"],
        });
        vi.mocked(postRepository.findById).mockResolvedValue(post);

        await useCase.execute({
            postId: "post-1",
            userId: "user-1",
            cdnBaseUrl: "https://cdn.example.com",
        });

        expect(storageService.delete).toHaveBeenCalledWith(
            "posts/user-1/img.jpg",
        );
    });

    it("should continue deletion even if storage delete fails", async () => {
        const post = buildPost({
            author: { id: "user-1" },
            mediaUrls: ["https://cdn.example.com/posts/user-1/img.jpg"],
        });
        vi.mocked(postRepository.findById).mockResolvedValue(post);
        vi.mocked(storageService.delete).mockRejectedValue(
            new Error("S3 unavailable"),
        );

        await useCase.execute({
            postId: "post-1",
            userId: "user-1",
            cdnBaseUrl: "https://cdn.example.com",
        });

        expect(logger.error).toHaveBeenCalledOnce();
        expect(postRepository.delete).toHaveBeenCalledWith("post-1");
    });
});
