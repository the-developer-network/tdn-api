/**
 * type for the GetUserPostsUseCase, defining the structure of the data required to retrieve a user's posts with pagination and optional filtering by post type.
 * This interface ensures that the use case receives all necessary information to perform its function, including the username of the post author, pagination parameters, and optional filters.
 */
export interface GetUserPostsInput {
    /**
     * The username of the author whose posts are being retrieved. This is a required field and is used to identify which user's posts to fetch.
     */
    username: string;
    /**
     * The page number for pagination. This is a required field and indicates which page of results to retrieve, allowing for efficient data fetching in cases where there are many posts.
     */
    page: number;
    /**
     * The number of posts to retrieve per page. This is a required field and helps to control the amount of data returned in each request, improving performance and user experience.
     */
    limit: number;
    /**
     * An optional filter to retrieve posts of a specific type. This allows clients to narrow down the results to only include posts that match a certain category or format, enhancing the flexibility of the API.
     */
    type?: string;
    /**
     * An optional ID of the current user making the request. This can be used to determine if the user has liked or bookmarked any of the posts in the results, allowing for personalized responses based on the user's interactions with the posts.
     */
    currentUserId?: string;
}
