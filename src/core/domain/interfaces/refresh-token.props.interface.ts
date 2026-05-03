/**
 * Props interface for RefreshToken entity
 *
 * Represents the properties required to create or update a refresh token.
 * Refresh tokens are used for authentication and authorization, allowing
 * users to obtain new access tokens without re-authenticating.
 */
export interface RefreshTokenProps {
    /** Unique identifier for the refresh token */
    id?: string;

    /** Hashed value of the refresh token for security */
    tokenHash: string;

    /** The unique identifier of the user who owns this token */
    userId: string;

    /** IP address of the device that requested this token */
    deviceIp: string;

    /** User agent string identifying the client application/device */
    userAgent: string;

    /** Expiration timestamp when this token becomes invalid */
    expiresAt: Date;

    /** Boolean flag indicating whether this token has been revoked */
    isRevoked: boolean;

    /** Creation timestamp of the refresh token */
    createdAt?: Date;

    /** Last update timestamp of the refresh token */
    updatedAt?: Date;
}
