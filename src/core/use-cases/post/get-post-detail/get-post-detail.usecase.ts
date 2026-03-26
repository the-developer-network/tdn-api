import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { Post } from "@core/domain/entities/post.entity";
import { NotFoundError } from "@core/errors";

export class GetPostDetailUseCase {
    constructor(private readonly postRepository: IPostRepository) {}

    async execute(postId: string, userId?: string): Promise<Post> {
        const post = await this.postRepository.findById(postId, userId);

        if (!post) {
            throw new NotFoundError("Post not found");
        }

        return post;
    }
}
