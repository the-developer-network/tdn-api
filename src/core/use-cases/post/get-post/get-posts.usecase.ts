import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { CachePort } from "@core/ports/services/cache.port";
import type { GetPostsInput } from "./get-posts-usecase.input";
import type { GetPostsOutput } from "./get-posts-usecase.output";

export class GetPostsUseCase {
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly cacheService: CachePort,
    ) {}

    async execute(request: GetPostsInput): Promise<GetPostsOutput> {
        const page = request.page || 1;
        const limit = request.limit || 10;
        const typeStr = request.type || "ALL";

        const cacheKey = `posts:feed:page:${page}:limit:${limit}:type:${typeStr}`;

        const cachedData = await this.cacheService.get(cacheKey);

        if (cachedData) {
            return JSON.parse(cachedData) as GetPostsOutput;
        }

        const { posts, total } = await this.postRepository.findAll({
            page,
            limit,
            type: request.type,
        });

        const totalPages = Math.ceil(total / limit);

        const response: GetPostsOutput = {
            data: posts,
            meta: { total, page, limit, totalPages },
        };

        await this.cacheService.set(cacheKey, JSON.stringify(response), 60);

        return response;
    }
}
