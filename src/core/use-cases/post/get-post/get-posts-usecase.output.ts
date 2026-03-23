import type { Post } from "@core/domain/entities/post.entity";

export interface GetPostsOutput {
    data: Post[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
