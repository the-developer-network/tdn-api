import type { VerificationTokenProps } from "@core/domain/interfaces/verification-token.props.interface";

/**
 * Rich domain model for VerificationToken entity
 *
 * Encapsulates both data and business logic related to verification tokens.
 * Verification tokens are used for email verification, password reset,
 * and other account verification processes within the application.
 *
 * This entity follows domain-driven design principles by encapsulating
 * business logic and validation within the entity itself.
 */
export class VerificationToken {
    private constructor(private readonly props: VerificationTokenProps) {}

    public static create(
        userId: string,
        tokenHash: string,
        type: VerificationTokenProps["type"],
        expiresAt: Date,
    ): VerificationToken {
        return new VerificationToken({ userId, tokenHash, type, expiresAt });
    }

    public static with(props: VerificationTokenProps): VerificationToken {
        return new VerificationToken(props);
    }

    /**
     * Get the unique identifier for the verification token
     * @returns The verification token ID
     */
    get id(): string {
        return this.props.id!;
    }

    /**
     * Get the hashed value of the verification token for security
     * @returns The token hash string
     */
    get tokenHash(): string {
        return this.props.tokenHash;
    }

    /**
     * Get the unique identifier of the user associated with this token
     * @returns The user ID
     */
    get userId(): string {
        return this.props.userId;
    }

    /**
     * Get the type of verification this token is for
     * @returns The verification type enum value
     */
    get type(): string {
        return this.props.type;
    }

    /**
     * Get the expiration timestamp when this token becomes invalid
     * @returns The expiration date
     */
    get expiresAt(): Date {
        return this.props.expiresAt;
    }

    /**
     * Get the creation timestamp of the verification token
     * @returns The creation date
     */
    get createdAt(): Date {
        return this.props.createdAt!;
    }

    /**
     * Check if the verification token has expired
     * @returns True if the current time is past the expiration date
     */
    isExpired(): boolean {
        return new Date() > this.props.expiresAt;
    }

    /**
     * Check if the verification token is valid for use
     * @returns True if the token has not expired
     */
    public isValid(): boolean {
        return !this.isExpired();
    }
}
