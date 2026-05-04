import { User } from "@core/domain/entities/user.entity";
import type { UserProps } from "@core/domain/interfaces/user-props.interface";
import { RefreshToken } from "@core/domain/entities/refresh-token.entity";
import type { RefreshTokenProps } from "@core/domain/interfaces/refresh-token.props.interface";

export function buildUser(overrides: Partial<UserProps> = {}): User {
    return User.with({
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        passwordHash: "hashed_password",
        isEmailVerified: true,
        isBot: false,
        deletedAt: null,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        ...overrides,
    });
}

export function buildRefreshToken(
    overrides: Partial<RefreshTokenProps> = {},
): RefreshToken {
    return RefreshToken.with({
        id: "token-1",
        tokenHash: "hashed_token",
        userId: "user-1",
        deviceIp: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        ...overrides,
    });
}
