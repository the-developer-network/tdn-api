/**
 * Output interface for retrieving the current authenticated user's information.
 *
 * This interface defines the structure of the data returned when fetching
 * the current user's profile information and connected OAuth providers.
 */
export interface GetMeUserUseCaseOutput {
    /**
     * The user's unique identifier.
     */
    id: string;

    /**
     * The user's unique username.
     */
    username: string;

    /**
     * The user's email address.
     */
    email: string;

    /**
     * Indicates whether the user's email address has been verified.
     */
    isEmailVerified: boolean;

    /**
     * The timestamp when the user account was created.
     */
    createdAt: Date;

    /**
     * The timestamp when the user account was last updated.
     */
    updatedAt: Date;

    /**
     * Indicates whether the user is a bot account.
     */
    isBot?: boolean;

    /**
     * Array of OAuth provider names that the user has connected to their account.
     * Common values include "google", "github", etc.
     */
    providers: string[];
}
