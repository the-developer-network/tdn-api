/**
 * Output data transfer object for the Login use case
 */
export interface LoginOutput {
    /**
     * Basic profile information of the authenticated user
     */
    user: {
        /** Unique identifier of the authenticated user */
        id: string;
        /** Username of the authenticated user */
        username: string;
        /** Whether the user's email address has been verified */
        isEmailVerified: boolean;
    };

    /**
     * Authentication tokens issued upon successful login
     */
    tokens: {
        /** Short-lived JWT access token for authenticating requests */
        accessToken: string;
        /** Unix timestamp indicating when the access token expires */
        expiresAt: number;
        /** Long-lived token used to obtain new access tokens */
        refreshToken: string;
        /** Unix timestamp (in seconds) indicating when the refresh token expires */
        refreshTokenExpiresAt: number;
    };
}
