import type { PostOutput } from "@core/ports/repositories/post.repository";

export interface GetPostsOutput {
    data: PostOutput[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
