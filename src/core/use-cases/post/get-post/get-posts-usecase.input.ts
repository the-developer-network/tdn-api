import type { PostType } from "@core/ports/repositories/post.repository";

export interface GetPostsInput {
    page?: number;
    limit?: number;
    type?: PostType;
}
