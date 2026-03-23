import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { StoragePort } from "@core/ports/services/storage.port";
import type { LoggerPort } from "@core/ports/services/logger.port";
import { UnauthorizedActionError } from "@core/errors/unauthorized-action.error";
import NotFoundError from "@core/errors/not-found.error";
import type { DeletePostUseCaseInput } from "./delete-post-usecase.input";
import type { CachePort } from "@core/ports/services/cache.port";

export class DeletePostUseCase {
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly storageService: StoragePort,
        private readonly logger: LoggerPort,
        private readonly cacheService: CachePort,
    ) {}

    async execute(input: DeletePostUseCaseInput): Promise<void> {
        const post = await this.postRepository.findById(input.postId);

        if (!post) {
            throw new NotFoundError("Post Not Found.");
        }

        if (post.author.id !== input.userId) {
            throw new UnauthorizedActionError(
                "You can only delete your own posts.",
            );
        }

        if (post.mediaUrls && post.mediaUrls.length > 0) {
            for (const fullUrl of post.mediaUrls) {
                try {
                    const fileKey = fullUrl
                        .replace(`${input.cdnBaseUrl}/`, "")
                        .replace(`${input.cdnBaseUrl}`, "");

                    await this.storageService.delete(fileKey);
                } catch (error) {
                    this.logger.error(
                        { err: error, postId: post.id, targetUrl: fullUrl },
                        "When deleting mail, the connected media could not be deleted from AWS.",
                    );
                }
            }
        }

        await this.cacheService.deleteByPattern("posts:feed:*");
        await this.postRepository.delete(input.postId);
    }
}
