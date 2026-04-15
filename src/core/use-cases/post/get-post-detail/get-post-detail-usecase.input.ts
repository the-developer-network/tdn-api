/**
 * GetPostDetailUseCaseInput defines the input parameters for the GetPostDetailUseCase.
 * It includes the postId, which is required to identify the post to retrieve, and an optional userId, which can be used to determine if the user has access to the post.
 */
export interface GetPostDetailUseCaseInput {
    /**
     * The ID of the post to retrieve. This is a required field and must be a string. It is used by the GetPostDetailUseCase to identify which post's details to fetch from the repository.
     */
    postId: string;
    /**
     * The ID of the current user, which is optional. This can be used by the GetPostDetailUseCase to determine if the user has access to the post. If provided, the use case may check permissions or visibility settings for the post based on the user's identity.
     */
    userId?: string;
}
