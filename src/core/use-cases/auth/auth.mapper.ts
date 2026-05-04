import type { UserPayload } from "@core/ports/services/auth-token.port";

/**
 * Mapper class for authentication-related data transformations in the Core layer.
 * Handles conversions between Domain entities and safe Output DTOs for auth responses.
 *
 * This mapper is part of the Core/Application layer and should not depend on
 * infrastructure-specific implementations.
 */
export class AuthMapper {
    /**
     * Maps a UserPayload to a safe response object for authentication.
     * Strips out any sensitive information and ensures proper serialization.
     *
     * @param userPayload - The user payload from authentication service
     * @returns A sanitized user object safe for external API responses
     */
    static toUserOutput(userPayload: UserPayload): {
        id: string;
        username: string;
    } {
        return {
            id: userPayload.id,
            username: userPayload.username,
        };
    }

    /**
     * Maps token data to a safe response object.
     *
     * @param tokens - Token data including access and refresh tokens
     * @returns A sanitized token object safe for external API responses
     */
    static toTokenOutput(tokens: {
        accessToken: string;
        expiresAt: number;
        refreshToken: string;
        refreshTokenExpiresAt: number;
    }): {
        accessToken: string;
        expiresAt: number;
        refreshToken: string;
        refreshTokenExpiresAt: number;
    } {
        return {
            accessToken: tokens.accessToken,
            expiresAt: tokens.expiresAt,
            refreshToken: tokens.refreshToken,
            refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        };
    }

    /**
     * Maps complete auth response to safe output format.
     *
     * @param authData - Complete authentication data
     * @returns Safe auth output with user and tokens
     */
    static toAuthOutput(authData: {
        user: UserPayload;
        accessToken: string;
        expiresAt: number;
        refreshToken: string;
        refreshTokenExpiresAt: number;
    }): {
        user: { id: string; username: string };
        tokens: {
            accessToken: string;
            expiresAt: number;
            refreshToken: string;
            refreshTokenExpiresAt: number;
        };
    } {
        return {
            user: this.toUserOutput(authData.user),
            tokens: this.toTokenOutput({
                accessToken: authData.accessToken,
                expiresAt: authData.expiresAt,
                refreshToken: authData.refreshToken,
                refreshTokenExpiresAt: authData.refreshTokenExpiresAt,
            }),
        };
    }
}
