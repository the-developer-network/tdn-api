import type { UserPayload } from "@core/ports/services/auth-token.port";
/**
 * Output data transfer object for the Refresh use case
 * @property {string} accessToken - The new access token for the user
 * @property {number} expiresAt - The timestamp when the access token expires
 * @property {string} refreshToken - The new refresh token for the user
 * @property {number} refreshTokenExpiresAt - The Unix timestamp (in seconds) of the new refresh token expiration
 * @property {UserPayload} user - The payload containing user information included in the token
 */
export interface RefreshOutput {
    /**
     * The new access token for the user, used to authenticate subsequent requests
     */
    accessToken: string;
    /**
     * The timestamp (in seconds since epoch) when the access token expires, used by clients to know when to refresh again
     */
    expiresAt: number;
    /**
     * The new refresh token for the user, used to obtain new access tokens in the future without re-authenticating
     */
    refreshToken: string;
    /**
     * The expiration date of the new refresh token, used by clients to know when they need to prompt the user to log in again
     */
    refreshTokenExpiresAt: number;
    /**
     * The payload containing user information included in the token, which can be used by clients to display user info without needing to decode the token themselves
     */
    user: UserPayload;
}
