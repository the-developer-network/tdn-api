import type { RefreshTokenProps } from "@core/domain/interfaces/refresh-token.props.interface";

/**
 * Rich domain model for RefreshToken entity
 *
 * Encapsulates both data and business logic related to refresh tokens.
 * Refresh tokens are used for authentication and authorization, allowing
 * users to obtain new access tokens without re-authenticating.
 *
 * This entity follows domain-driven design principles by encapsulating
 * business logic and validation within the entity itself.
 */
export class RefreshToken {
    private constructor(private readonly props: RefreshTokenProps) {}

    public static create(
        userId: string,
        tokenHash: string,
        deviceIp: string,
        userAgent: string,
        expiresAt: Date,
    ): RefreshToken {
        return new RefreshToken({
            userId,
            tokenHash,
            deviceIp,
            userAgent,
            expiresAt,
            isRevoked: false,
        });
    }

    public static with(props: RefreshTokenProps): RefreshToken {
        return new RefreshToken(props);
    }

    /**
     * Get the unique identifier for the refresh token
     * @returns The refresh token ID
     */
    get id(): string {
        return this.props.id!;
    }

    /**
     * Get the hashed value of the refresh token for security
     * @returns The token hash string
     */
    get tokenHash(): string {
        return this.props.tokenHash;
    }

    /**
     * Get the unique identifier of the user who owns this token
     * @returns The user ID
     */
    get userId(): string {
        return this.props.userId;
    }

    /**
     * Get the IP address of the device that requested this token
     * @returns The device IP address
     */
    get deviceIp(): string {
        return this.props.deviceIp;
    }

    /**
     * Get the user agent string identifying the client application/device
     * @returns The user agent string
     */
    get userAgent(): string {
        return this.props.userAgent;
    }

    /**
     * Get the expiration timestamp when this token becomes invalid
     * @returns The expiration date
     */
    get expiresAt(): Date {
        return this.props.expiresAt;
    }

    /**
     * Check if this token has been revoked
     * @returns True if the token has been revoked, false otherwise
     */
    get isRevoked(): boolean {
        return this.props.isRevoked;
    }

    /**
     * Get the creation timestamp of the refresh token
     * @returns The creation date
     */
    get createdAt(): Date {
        return this.props.createdAt!;
    }

    /**
     * Get the last update timestamp of the refresh token
     * @returns The last update date
     */
    get updatedAt(): Date {
        return this.props.updatedAt!;
    }

    /**
     * Check if the refresh token has expired
     * @returns True if the current time is past the expiration date
     */
    public isExpired(): boolean {
        return new Date() > this.props.expiresAt;
    }

    /**
     * Check if the refresh token is valid for use
     * @returns True if the token is not revoked and not expired
     */
    public isValid(): boolean {
        return !this.props.isRevoked && !this.isExpired();
    }

    /**
     * Revoke the refresh token
     * This method mutates the entity state to mark the token as revoked
     */
    public revoke(): void {
        this.props.isRevoked = true;
        this.props.updatedAt = new Date();
    }
}
