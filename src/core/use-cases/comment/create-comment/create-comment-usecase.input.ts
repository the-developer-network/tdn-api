export interface CreateCommentUseCaseInput {
    content: string;
    postId: string;
    authorId: string;
    parentId?: string;
    mediaUrls?: string[];
}
