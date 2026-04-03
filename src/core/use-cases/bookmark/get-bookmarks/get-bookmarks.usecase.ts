/**
 * Use case for retrieving a user's bookmarked posts and comments
 */
import type { IPostRepository } from "@core/ports/repositories/post.repository";
import type { ICommentBookmarkRepository } from "@core/ports/repositories/comment-bookmark.repository";
import type { GetBookmarksUseCaseInput } from "./get-bookmarks-usecase.input";
import type { Post } from "@core/domain/entities/post.entity";
import type { Comment } from "@core/domain/entities/comment.entity";

export class GetBookmarksUseCase {
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly commentBookmarkRepository: ICommentBookmarkRepository,
    ) {}

    async execute(input: GetBookmarksUseCaseInput): Promise<{
        posts: Post[];
        postTotal: number;
        comments: Comment[];
        commentTotal: number;
    }> {
        const page = input.page || 1;
        const limit = input.limit || 10;
        const offset = (page - 1) * limit;

        const [postResult, commentResult] = await Promise.all([
            this.postRepository.findAll({
                page,
                limit,
                savedByUserId: input.userId,
                currentUserId: input.userId,
            }),
            this.commentBookmarkRepository.findBookmarkedByUserId(
                input.userId,
                limit,
                offset,
            ),
        ]);

        return {
            posts: postResult.posts,
            postTotal: postResult.total,
            comments: commentResult.comments,
            commentTotal: commentResult.total,
        };
    }
}
