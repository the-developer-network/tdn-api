import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetPostDetailUseCase } from "@core/use-cases/post/get-post-detail";
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import { NotFoundError } from "@core/errors";
import { buildPost } from "../../../helpers/mock-factories";

describe("GetPostDetailUseCase", () => {
    let useCase: GetPostDetailUseCase;
    let postRepository: Pick<IPostRepository, "findById">;

    beforeEach(() => {
        postRepository = {
            findById: vi.fn(),
        };
        useCase = new GetPostDetailUseCase(postRepository as IPostRepository);
    });

    it("should return post when found", async () => {
        const post = buildPost({ id: "post-42" });
        vi.mocked(postRepository.findById).mockResolvedValue(post);

        const result = await useCase.execute({
            postId: "post-42",
            userId: "user-1",
        });

        expect(result).toBe(post);
        expect(postRepository.findById).toHaveBeenCalledWith(
            "post-42",
            "user-1",
        );
    });

    it("should throw NotFoundError when post not found", async () => {
        vi.mocked(postRepository.findById).mockResolvedValue(null);

        await expect(
            useCase.execute({ postId: "ghost-post", userId: undefined }),
        ).rejects.toThrow(NotFoundError);
    });
});
