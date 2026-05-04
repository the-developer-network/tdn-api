/**
 * Represents the identity payload embedded in an access token.
 */
export interface UserPayload {
    /** The unique identifier of the authenticated user. */
    id: string;

    /** The username of the authenticated user. */
    username: string;
}

/**
 * Contains the generated access and refresh token details.
 */
export interface TokenResult {
    /** The signed JWT access token. */
    accessToken: string;

    /** The Unix timestamp (in seconds) at which the access token expires. */
    expiresAt: number;

    /** The opaque random refresh token string. */
    refreshToken: string;

    /** The Unix timestamp (in seconds) at which the refresh token expires. */
    refreshTokenExpiresAt: number;
}

/**
 * Represents the payload embedded in a recovery token.
 */
export interface RecoveryPayload {
    /** The subject of the token, corresponding to the user's unique identifier. */
    sub: string;

    /** The intended purpose of the token (e.g. `"account_recovery"`). */
    purpose: string;
}

/**
 * Port interface for authentication token operations.
 */
export interface AuthTokenPort {
    /**
     * Generates a signed JWT access token and a random refresh token for the given user.
     *
     * @param payload - The user identity data to embed in the access token.
     * @returns An object containing the access token, its expiry, the refresh token, and its expiry.
     */
    generate(payload: UserPayload): TokenResult;

    /**
     * Verifies a JWT access token and returns the embedded user payload.
     *
     * @param token - The JWT access token to verify.
     * @returns The decoded user payload if the token is valid.
     * @throws If the token is invalid or expired.
     */
    verify(token: string): UserPayload;

    /**
     * Hashes a refresh token secret using SHA-256 for secure storage.
     *
     * @param secret - The plain-text refresh token to hash.
     * @returns The hex-encoded SHA-256 hash of the secret.
     */
    hashRefreshSecret(secret: string): string;

    /**
     * Generates a signed JWT recovery token for the given user.
     * The token embeds the user ID as `sub` and `"account_recovery"` as its purpose.
     *
     * @param userId - The unique identifier of the user requesting recovery.
     * @returns A signed JWT recovery token string.
     */
    generateRecoveryToken(userId: string): string;

    /**
     * Verifies a recovery token and returns its embedded payload.
     *
     * @param token - The JWT recovery token to verify.
     * @returns The decoded recovery payload containing `sub` and `purpose`.
     * @throws If the token is invalid or expired.
     */
    verifyRecoveryToken(token: string): RecoveryPayload;
}
