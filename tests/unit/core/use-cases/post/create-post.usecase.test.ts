import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatePostUseCase } from "@core/use-cases/post/create-post";
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { CachePort } from "@core/ports/services/cache.port";
import { NotFoundError } from "@core/errors/common/not-found.error";
import { ForbiddenError } from "@core/errors/common/forbidden.error";
import { PostType } from "@core/domain/enums/post-type.enum";
import { buildUser, buildPost } from "../../../helpers/mock-factories";

describe("CreatePostUseCase", () => {
    let useCase: CreatePostUseCase;
    let postRepository: Pick<IPostRepository, "create">;
    let userRepository: Pick<IUserRepository, "findById">;
    let cacheService: Pick<CachePort, "deleteByPattern">;

    beforeEach(() => {
        postRepository = {
            create: vi.fn().mockResolvedValue(buildPost()),
        };
        userRepository = {
            findById: vi.fn(),
        };
        cacheService = {
            deleteByPattern: vi.fn().mockResolvedValue(undefined),
        };
        useCase = new CreatePostUseCase(
            postRepository as IPostRepository,
            cacheService as CachePort,
            userRepository as IUserRepository,
        );
    });

    it("should create and return post for COMMUNITY type without user lookup", async () => {
        const created = buildPost({ type: PostType.COMMUNITY });
        vi.mocked(postRepository.create).mockResolvedValue(created);

        const result = await useCase.execute({
            content: "Hello world",
            type: PostType.COMMUNITY,
            authorId: "user-1",
        });

        expect(result).toBe(created);
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when author not found for SYSTEM_UPDATE type", async () => {
        vi.mocked(userRepository.findById).mockResolvedValue(null);

        await expect(
            useCase.execute({
                content: "System update",
                type: PostType.SYSTEM_UPDATE,
                authorId: "ghost-user",
            }),
        ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when non-bot creates TECH_NEWS", async () => {
        const nonBotUser = buildUser({ isBot: false });
        vi.mocked(userRepository.findById).mockResolvedValue(nonBotUser);

        await expect(
            useCase.execute({
                content: "Tech news",
                type: PostType.TECH_NEWS,
                authorId: "user-1",
            }),
        ).rejects.toThrow(ForbiddenError);
    });

    it("should allow bot user to create SYSTEM_UPDATE", async () => {
        const botUser = buildUser({ isBot: true });
        vi.mocked(userRepository.findById).mockResolvedValue(botUser);
        const created = buildPost({ type: PostType.SYSTEM_UPDATE });
        vi.mocked(postRepository.create).mockResolvedValue(created);

        const result = await useCase.execute({
            content: "System update",
            type: PostType.SYSTEM_UPDATE,
            authorId: "bot-1",
        });

        expect(result).toBe(created);
    });

    it("should invalidate posts:feed:* cache after creation", async () => {
        vi.mocked(postRepository.create).mockResolvedValue(buildPost());

        await useCase.execute({
            content: "Hello",
            type: PostType.COMMUNITY,
            authorId: "user-1",
        });

        expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
            "posts:feed:*",
        );
    });
});
