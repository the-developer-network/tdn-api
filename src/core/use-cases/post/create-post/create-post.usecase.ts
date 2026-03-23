import { type IPostRepository } from "@core/ports/repositories/post.repository";
import type { CreatePostInput } from "./create-post-usecase.input";
import type { CachePort } from "@core/ports/services/cache.port";

export class CreatePostUseCase {
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly cacheService: CachePort,
    ) {}

    async execute(request: CreatePostInput): Promise<void> {
        await this.postRepository.create({
            content: request.content,
            type: request.type,
            mediaUrls: request.mediaUrls,
            authorId: request.authorId,
        });
        await this.cacheService.deleteByPattern("posts:feed:*");
    }
}
