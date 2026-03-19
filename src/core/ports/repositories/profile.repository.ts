import type { UpdateProfileInput } from "@core/use-cases/profile/update-profil/update-profile-usecase.input";
import type { Profile } from "@core/entities/profile.entitiy";

/**
 * Data access contract for managing User Profile persistence.
 * This port defines the required operations for profile data management,
 * abstracting the underlying database implementation.
 */
export interface IProfileRepository {
    /**
     * Updates the user's avatar URL in the persistence layer.
     * * @param userId - The unique identifier of the user.
     * @param avatarUrl - The new storage path/URL for the avatar, or null to revert to default.
     * @returns A promise that resolves once the update is successfully committed.
     */
    updateAvatar(userId: string, avatarUrl: string): Promise<void>;

    /**
     * Retrieves only the avatar URL for a specific user.
     * Optimized for high-performance scenarios where the full profile entity is not required.
     * * @param userId - The unique identifier of the user.
     * @returns A promise resolving to the avatar URL string, or null if not found.
     */
    findAvatarByUserId(userId: string): Promise<string | null>;

    /**
     * Performs an atomic update of profile-related information.
     * Designed for high-concurrency and security by utilizing partial updates
     * without requiring a prior 'find' operation (Atomic Write).
     * * @param userId - The unique identifier of the user.
     * @param data - The partial profile data to be updated (fullName, bio, socials, etc.).
     * @returns A promise that resolves when the update operation is completed.
     */
    update(userId: string, data: UpdateProfileInput): Promise<void>;

    /**
     * Retrieves the complete Profile domain entity for a specific user.
     * * @param userId - The unique identifier of the user.
     * @returns A promise resolving to the Profile entity, or null if the profile does not exist.
     */
    findByUserId(userId: string): Promise<Profile | null>;
    /**
     * Updates the banner image URL for a specific user's profile.
     * * @param userId - The unique identifier of the user.
     * @param bannerUrl - The new storage URL of the banner image.
     * @returns A promise that resolves when the update is complete.
     */
    updateBanner(userId: string, bannerUrl: string): Promise<void>;

    /**
     * Retrieves only the banner URL for a specific user.
     * Useful for cleanup operations before uploading a new banner.
     * * @param userId - The unique identifier of the user.
     * @returns A promise resolving to the banner URL string, or null if no banner is set.
     */
    findBannerByUserId(userId: string): Promise<string | null>;
    /**
     * Retrieves a profile along with user data using the unique username.
     * @param username - The unique handle of the user.
     * @returns A promise resolving to the Profile entity or null if not found.
     */
    findByUsername(username: string): Promise<Profile | null>;
    /**
     * Searches for profiles based on a query string matching username or full name.
     * @param query - The search term.
     * @param limit - Maximum number of results to return (default: 10).
     * @returns A promise resolving to an array of Profile entities.
     */
    search(query: string, limit?: number): Promise<Profile[]>;
    /**
     * Checks if a user is following another user.
     * @param followerId - The ID of the user who might be following.
     * @param followingId - The ID of the user being followed.
     * @returns A boolean indicating if the follow relationship exists.
     */
    checkIsFollowing(followerId: string, followingId: string): Promise<boolean>;
}
