import { type IPostRepository } from "@core/ports/repositories/post.repository";
import type { CreatePostInput } from "./create-post-usecase.input";
import type { CachePort } from "@core/ports/services/cache.port";
import { Post } from "@core/domain/entities/post.entity";

export class CreatePostUseCase {
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly cacheService: CachePort,
    ) {}

    async execute(request: CreatePostInput): Promise<void> {
        const post = Post.create(
            request.content,
            request.type,
            request.authorId,
            request.mediaUrls || [],
        );

        await this.postRepository.create(post);
        await this.cacheService.deleteByPattern("posts:feed:*");
    }
}
