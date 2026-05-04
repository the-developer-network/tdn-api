import { User } from "@core/domain/entities/user.entity";
import type { UserProps } from "@core/domain/interfaces/user-props.interface";
import { RefreshToken } from "@core/domain/entities/refresh-token.entity";
import type { RefreshTokenProps } from "@core/domain/interfaces/refresh-token.props.interface";
import { VerificationToken } from "@core/domain/entities/verification-token.entity";
import type { VerificationTokenProps } from "@core/domain/interfaces/verification-token.props.interface";
import { Comment } from "@core/domain/entities/comment.entity";
import type { CommentProps } from "@core/domain/interfaces/comment-props.interface";
import { Profile } from "@core/domain/entities/profile.entity";
import type { ProfileProps } from "@core/domain/interfaces/profile-props.interface";
import { TokenType } from "@core/domain/enums/token-type.enum";

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

export function buildVerificationToken(
    overrides: Partial<VerificationTokenProps> = {},
): VerificationToken {
    return VerificationToken.with({
        id: "vtoken-1",
        tokenHash: "hashed_otp",
        userId: "user-1",
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date("2024-01-01T00:00:00Z"),
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

export function buildComment(overrides: Partial<CommentProps> = {}): Comment {
    return Comment.with({
        id: "comment-1",
        content: "Test comment",
        postId: "post-1",
        authorId: "user-1",
        parentId: null,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        ...overrides,
    });
}

export function buildProfile(overrides: Partial<ProfileProps> = {}): Profile {
    return Profile.with({
        id: "profile-1",
        userId: "user-1",
        username: "testuser",
        fullName: "Test User",
        bio: null,
        location: null,
        avatarUrl: "https://example.com/avatar.png",
        bannerUrl: "https://example.com/banner.png",
        socials: null,
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        ...overrides,
    });
}
