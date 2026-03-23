import type {
    IPostRepository,
    PostOutput,
    PostType,
} from "@core/ports/repositories/post.repository";
import type { CachePort } from "@core/ports/services/cache.port";

export interface GetPostsRequest {
    page?: number;
    limit?: number;
    type?: PostType;
}

export interface GetPostsResponse {
    data: PostOutput[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export class GetPostsUseCase {
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly cacheService: CachePort,
    ) {}

    async execute(request: GetPostsRequest): Promise<GetPostsResponse> {
        const page = request.page || 1;
        const limit = request.limit || 10;
        const typeStr = request.type || "ALL";

        const cacheKey = `posts:feed:page:${page}:limit:${limit}:type:${typeStr}`;

        const cachedData = await this.cacheService.get(cacheKey);

        if (cachedData) {
            return JSON.parse(cachedData) as GetPostsResponse;
        }

        const { posts, total } = await this.postRepository.findAll({
            page,
            limit,
            type: request.type,
        });

        const totalPages = Math.ceil(total / limit);

        const response: GetPostsResponse = {
            data: posts,
            meta: { total, page, limit, totalPages },
        };

        await this.cacheService.set(cacheKey, JSON.stringify(response), 60);

        return response;
    }
}
