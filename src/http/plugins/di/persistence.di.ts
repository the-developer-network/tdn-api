import { asClass, asFunction } from "awilix";
import { PrismaUserRepository } from "@infrastructure/persistence/repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "@infrastructure/persistence/repositories/prisma-refresh-token.repository";
import { PrismaVerificationTokenRepository } from "@infrastructure/persistence/repositories/prisma-verification-token.repository";
import { PrismaOAuthAccountRepository } from "@infrastructure/persistence/repositories/prisma-oauth-account.repository";
import { PrismaProfileRepository } from "@infrastructure/persistence/repositories/prisma-profile.repository";
import { PrismaFollowUserRepository } from "@infrastructure/persistence/repositories/prisma-follow.repository";
import { PrismaNotificationRepository } from "@infrastructure/persistence/repositories/prisma-notification.repository";
import { PrismaPostRepository } from "@infrastructure/persistence/repositories/prisma-post.repository";

export const persistenceModule = {
    // --- Repositories ---
    userRepository: asFunction((prisma, config) => {
        return new PrismaUserRepository(prisma, {
            gracePeriodDays: config.USER_PURGE_GRACE_PERIOD_DAYS,
        });
    }).singleton(),

    refreshTokenRepository: asFunction((prisma, config) => {
        return new PrismaRefreshTokenRepository(prisma, {
            gracePeriodDays: config.REFRESH_TOKEN_PURGE_GRACE_PERIOD_DAYS,
        });
    }).singleton(),

    verificationTokenRepository: asClass(
        PrismaVerificationTokenRepository,
    ).singleton(),
    oauthAccountRepository: asClass(PrismaOAuthAccountRepository).singleton(),
    profileRepository: asClass(PrismaProfileRepository).singleton(),
    followUserRepository: asClass(PrismaFollowUserRepository).singleton(),
    notificationRepository: asClass(PrismaNotificationRepository).singleton(),
    postRepository: asClass(PrismaPostRepository).singleton(),
};
