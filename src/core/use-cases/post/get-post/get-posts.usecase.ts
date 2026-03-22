import type {
    IPostRepository,
    PostOutput,
    PostType,
} from "@core/ports/repositories/post.repository";

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
    constructor(private readonly postRepository: IPostRepository) {}

    async execute(request: GetPostsRequest): Promise<GetPostsResponse> {
        const page = request.page || 1;
        const limit = request.limit || 10;

        const { posts, total } = await this.postRepository.findAll({
            page,
            limit,
            type: request.type,
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data: posts,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
}
