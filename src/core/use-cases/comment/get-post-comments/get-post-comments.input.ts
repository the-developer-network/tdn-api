export interface GetPostCommentsInput {
    postId: string;
    page?: number;
    limit?: number;
    currentUserId?: string;
}
