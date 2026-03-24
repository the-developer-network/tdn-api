import { asClass, asFunction } from "awilix";
import { PrismaUserRepository } from "@infrastructure/persistence/repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "@infrastructure/persistence/repositories/prisma-refresh-token.repository";
import { PrismaVerificationTokenRepository } from "@infrastructure/persistence/repositories/prisma-verification-token.repository";
import { PrismaOAuthAccountRepository } from "@infrastructure/persistence/repositories/prisma-oauth-account.repository";
import { PrismaProfileRepository } from "@infrastructure/persistence/repositories/prisma-profile.repository";
import { PrismaFollowUserRepository } from "@infrastructure/persistence/repositories/prisma-follow.repository";
import { PrismaNotificationRepository } from "@infrastructure/persistence/repositories/prisma-notification.repository";
import { PrismaPostRepository } from "@infrastructure/persistence/repositories/prisma-post.repository";
import { PrismaPostLikeRepository } from "@infrastructure/persistence/repositories/prisma-post-like.repository";
import { PrismaLikeRepository } from "@infrastructure/persistence/repositories/prisma-like.repository";
import { PrismaBookmarkRepository } from "@infrastructure/persistence/repositories/prisma-bookmark.repository";

/**
 * Dependency injection module for persistence layer
 *
 * Registers all repository implementations with the dependency injection container.
 * Each repository is configured as a singleton to ensure consistent database connections
 * and shared state across the application.
 */
export const persistenceModule = {
    // --- Repositories ---

    /**
     * User repository for managing user data persistence
     * Configured with grace period settings for user data cleanup
     */
    userRepository: asFunction((prisma, config) => {
        return new PrismaUserRepository(prisma, {
            gracePeriodDays: config.USER_PURGE_GRACE_PERIOD_DAYS,
        });
    }).singleton(),

    /**
     * Refresh token repository for managing refresh token persistence
     * Configured with grace period settings for token cleanup
     */
    refreshTokenRepository: asFunction((prisma, config) => {
        return new PrismaRefreshTokenRepository(prisma, {
            gracePeriodDays: config.REFRESH_TOKEN_PURGE_GRACE_PERIOD_DAYS,
        });
    }).singleton(),

    /**
     * Verification token repository for managing email verification tokens
     */
    verificationTokenRepository: asClass(
        PrismaVerificationTokenRepository,
    ).singleton(),

    /**
     * OAuth account repository for managing third-party authentication accounts
     */
    oauthAccountRepository: asClass(PrismaOAuthAccountRepository).singleton(),

    /**
     * Profile repository for managing user profile data
     */
    profileRepository: asClass(PrismaProfileRepository).singleton(),

    /**
     * Follow user repository for managing user follow relationships
     */
    followUserRepository: asClass(PrismaFollowUserRepository).singleton(),

    /**
     * Notification repository for managing user notifications
     */
    notificationRepository: asClass(PrismaNotificationRepository).singleton(),

    /**
     * Post repository for managing post data persistence
     */
    postRepository: asClass(PrismaPostRepository).singleton(),

    /**
     * Post like repository for managing post like relationships
     */
    postLikeRepository: asClass(PrismaPostLikeRepository).singleton(),

    /**
     * Like repository for managing like count operations
     */
    likeRepository: asClass(PrismaLikeRepository).singleton(),
    /**
     *
     */
    bookmarkRepository: asClass(PrismaBookmarkRepository).singleton(),
};
