export interface GetCommentRepliesInput {
    commentId: string;
    page: number;
    limit: number;
    currentUserId?: string;
}
