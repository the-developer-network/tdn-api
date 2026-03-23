/**
 * Repository interface for managing Follow relationships.
 * Following Clean Architecture principles, this interface defines the contract
 * for persisting and retrieving Follow domain entities without exposing
 * implementation details or DTOs.
 */
export interface IFollowRepository {
    /**
     * Checks if a user is following another user.
     * @param followerId - The ID of the user who might be following.
     * @param followingId - The ID of the user being followed.
     * @returns A boolean indicating if the follow relationship exists.
     */
    checkIsFollowing(followerId: string, followingId: string): Promise<boolean>;

    /**
     * Creates a follow relationship between two users.
     * @param followerId - The ID of the user initiating the follow (Current User).
     * @param followingId - The ID of the user being followed (Target User).
     */
    followUser(followerId: string, followingId: string): Promise<void>;

    /**
     * Removes a follow relationship between two users.
     * @param followerId - The ID of the user who is currently following.
     * @param followingId - The ID of the user being unfollowed.
     */
    unfollowUser(followerId: string, followingId: string): Promise<void>;

    /**
     * Retrieves a paginated list of users who follow the target user.
     * @param targetId - The ID of the user whose followers are being retrieved.
     * @param limit - The maximum number of followers to retrieve.
     * @param offset - The number of followers to skip (for pagination).
     * @returns An array of user information for followers.
     */
    getFollowers(
        targetId: string,
        limit: number,
        offset: number,
    ): Promise<
        {
            userId: string;
            username: string;
            fullName: string;
            avatarUrl: string;
            bio: string | null;
        }[]
    >;

    /**
     * Retrieves a paginated list of users that the target user is following.
     * @param targetId - The ID of the user whose following list is being retrieved.
     * @param limit - The maximum number of following users to retrieve.
     * @param offset - The number of following users to skip (for pagination).
     * @returns An array of user information for following users.
     */
    getFollowing(
        targetId: string,
        limit: number,
        offset: number,
    ): Promise<
        {
            userId: string;
            username: string;
            fullName: string;
            avatarUrl: string;
            bio: string | null;
        }[]
    >;

    /**
     * Checks which users from a list are being followed by a specific user.
     * @param followerId - The ID of the user doing the following.
     * @param followingIds - An array of user IDs to check.
     * @returns An array of user IDs that are being followed.
     */
    checkIsFollowingBulk(
        followerId: string,
        followingIds: string[],
    ): Promise<string[]>;
}
