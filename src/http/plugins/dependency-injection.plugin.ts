import { diContainer, fastifyAwilixPlugin } from "@fastify/awilix";
import { asClass, asFunction, asValue, InjectionMode } from "awilix";
import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

// --- Infrastructure ---
import { PrismaUserRepository } from "@infrastructure/repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "@infrastructure/repositories/prisma-refresh-token.repository";
import { PrismaVerificationTokenRepository } from "@infrastructure/repositories/prisma-verification-token.repository";
import { TransactionService } from "@infrastructure/database/transaction.service";
import { PasswordService } from "@infrastructure/services/password.service";
import { EmailService } from "@infrastructure/services/email.service";
import { AuthTokenService } from "@infrastructure/services/auth-token.service";
import { CryptoService } from "@infrastructure/services/crypto.service";
import { GithubAuthService } from "@infrastructure/services/github-auth.service";
import { GoogleAuthService } from "@infrastructure/services/google-auth.service";

// --- Use Cases ---
import SoftDeleteUserUseCase from "@core/use-cases/user/soft-delete/soft-delete-user.usecase";
import { CreateUserUseCase } from "@core/use-cases/user/create-user/create-user.usecase";
import { RegisterUseCase } from "@core/use-cases/auth/register/register.usecase";
import { LoginUseCase } from "@core/use-cases/auth/login/login.usecase";
import { GithubLoginUseCase } from "@core/use-cases/oauth/oauth-github/github-login.usecase";
import { RefreshUseCase } from "@core/use-cases/auth/refresh/refresh.usecase";
import { LogoutUseCase } from "@core/use-cases/auth/logout/logout.usecase";
import { SendVerificationEmailUseCase } from "@core/use-cases/auth/send-verification-email/send-verification-email.usecase";
import { VerifyEmailUseCase } from "@core/use-cases/auth/verify-email/verify-email.usecase";
import { ForgotPasswordUseCase } from "@core/use-cases/auth/forgot-password/forgot-password.usecase";
import { ResetPasswordUseCase } from "@core/use-cases/auth/reset-password/reset-password.usecase";
import { RecoverAccountUseCase } from "@core/use-cases/auth/recover-account/recover-account.usecase";
import { GoogleLoginUseCase } from "@core/use-cases/oauth/oauth-google/google.login.usecase";
import { PurgeExpiredUsersUseCase } from "@core/use-cases/user/purge-expired-users/purge-expired-users.use-case";
import { PurgeExpiredTokensUseCase } from "@core/use-cases/auth/cleanup-refresh-tokens/purge-expires-tokens.use.case";

// --- Jobs & Schedulers ---
import UserPurgeJob from "@infrastructure/jobs/user-purge.job";
import { RefreshTokenPurgeJob } from "@infrastructure/jobs/refresh-token-purge.job";
import { UserPurgeScheduler } from "@infrastructure/jobs/user-purge.scheduler";
import { RefreshTokenPurgeScheduler } from "@infrastructure/jobs/refresh-token-purge.scheduler";

// --- Controllers ---
import UserController from "@services/user.controller";
import AuthController from "@services/auth.controller";
import OAuthController from "@services/oauth.controller";
import { GetMeUserUseCase } from "@core/use-cases/user/get-me/get-me-user-.usecase";
import { PrismaOAuthAccountRepository } from "@infrastructure/repositories/prisma-oauth-account.repository";
import { ChangePasswordUseCase } from "@core/use-cases/user/change-password/change-password-use.case";
import { ChangeUsernameUseCase } from "@core/use-cases/user/change-username/change-username.usecase";
import { ChangeEmailUseCase } from "@core/use-cases/user/change-email/change-email.usecase";
import { ProfileController } from "@services/profile.controller";
import { UpdateAvatarUseCase } from "@core/use-cases/profile/update-avatar/update-avatar.usecase";
import { PrismaProfileRepository } from "@infrastructure/repositories/prisma-profile.repository";
import { S3StorageService } from "@infrastructure/services/s3-storage.service";
import { UpdateProfileUseCase } from "@core/use-cases/profile/update-profil/update-profile.use-case";
import { UpdateBannerUseCase } from "@core/use-cases/profile/update-banner/update-banner.use-case";
import { GetProfileUseCase } from "@core/use-cases/profile/get-profile/get-profile.usecase";
import { SearchProfilesUseCase } from "@core/use-cases/profile/search-profile/search-profile.usecase";
import { PrismaFollowUserRepository } from "@infrastructure/repositories/prisma-follow.repository";
import { FollowUserUseCase } from "@core/use-cases/follow-user/follow-user/follow-user.usecase";
import { UnfollowUserUseCase } from "@core/use-cases/follow-user/unfollow-user/unfollow-user.usecase";
import { FollowUserController } from "@services/follow-user.controller";
import { GetFollowersUseCase } from "@core/use-cases/follow-user/get-followers/get-followers.usecase";
import { GetFollowingUseCase } from "@core/use-cases/follow-user/get-following/get-following.usecase";
import { WebSocketManager } from "@infrastructure/websocket/websocket-manager";
import { FastifyRealtimeService } from "@infrastructure/services/fastify-realtime.service";
import { PrismaNotificationRepository } from "@infrastructure/repositories/prisma-notification.repository";

function dependencyInjectionPlugin(fastify: FastifyInstance): void {
    fastify.register(fastifyAwilixPlugin, {
        disposeOnClose: true,
        disposeOnResponse: false,
    });

    diContainer.options.injectionMode = InjectionMode.CLASSIC;

    diContainer.register({
        // --- Core ---
        prisma: asValue(fastify.prisma),
        logger: asValue(fastify.log),
        config: asValue(fastify.config),
        jwt: asValue(fastify.jwt),
        fastify: asValue(fastify),

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
        oauthAccountRepository: asClass(
            PrismaOAuthAccountRepository,
        ).singleton(),
        profileRepository: asClass(PrismaProfileRepository).singleton(),
        followUserRepository: asClass(PrismaFollowUserRepository).singleton(),
        notificationRepository: asClass(
            PrismaNotificationRepository,
        ).singleton(),
        // --- Services ---
        transactionService: asClass(TransactionService).singleton(),
        passwordService: asClass(PasswordService).singleton(),
        cryptoService: asClass(CryptoService).singleton(),
        storageService: asClass(S3StorageService).singleton(),
        emailService: asFunction((config, logger) => {
            return new EmailService(
                {
                    host: config.SMTP_HOST,
                    port: config.SMTP_PORT,
                    secure: config.SMTP_SECURE,
                    user: config.SMTP_USER,
                    pass: config.SMTP_PASS,
                    from: config.EMAIL_FROM,
                },
                logger,
            );
        }).singleton(),

        authTokenService: asFunction((jwt, config) => {
            return new AuthTokenService(
                jwt,
                config.ACCESS_TOKEN_EXPIRES_IN,
                config.REFRESH_TOKEN_EXPIRES_IN,
            );
        }).singleton(),

        githubAuthService: asFunction((config) => {
            return new GithubAuthService({
                clientId: config.GITHUB_CLIENT_ID,
                clientSecret: config.GITHUB_CLIENT_SECRET,
                callbackUrl: config.GITHUB_CALLBACK_URL,
            });
        }).singleton(),

        googleAuthService: asFunction((config) => {
            return new GoogleAuthService({
                clientId: config.GOOGLE_CLIENT_ID,
                clientSecret: config.GOOGLE_CLIENT_SECRET,
                callbackUrl: config.GOOGLE_CALLBACK_URL,
            });
        }).singleton(),

        // --- Use Cases ---
        softDeleteUserUseCase: asClass(SoftDeleteUserUseCase).singleton(),
        createUserUseCase: asClass(CreateUserUseCase).singleton(),
        registerUseCase: asClass(RegisterUseCase).singleton(),
        loginUseCase: asClass(LoginUseCase).singleton(),
        githubLoginUseCase: asClass(GithubLoginUseCase).singleton(),
        googleLoginUseCase: asClass(GoogleLoginUseCase).singleton(),
        refreshUseCase: asClass(RefreshUseCase).singleton(),
        logoutUseCase: asClass(LogoutUseCase).singleton(),
        sendVerificationEmailUseCase: asClass(
            SendVerificationEmailUseCase,
        ).singleton(),
        verifyEmailUseCase: asClass(VerifyEmailUseCase).singleton(),
        forgotPasswordUseCase: asClass(ForgotPasswordUseCase).singleton(),
        resetPasswordUseCase: asClass(ResetPasswordUseCase).singleton(),
        recoverAccountUseCase: asClass(RecoverAccountUseCase).singleton(),
        purgeExpiredUsersUseCase: asClass(PurgeExpiredUsersUseCase).singleton(),
        purgeExpiredTokensUseCase: asClass(
            PurgeExpiredTokensUseCase,
        ).singleton(),
        getMeUserUseCase: asClass(GetMeUserUseCase).singleton(),
        changePasswordUseCase: asClass(ChangePasswordUseCase).singleton(),
        changeUsernameUseCase: asClass(ChangeUsernameUseCase).singleton(),
        changeEmailUseCase: asClass(ChangeEmailUseCase).singleton(),
        updateAvatarUseCase: asClass(UpdateAvatarUseCase).singleton(),
        updateProfileUseCase: asClass(UpdateProfileUseCase).singleton(),
        updateBannerUseCase: asClass(UpdateBannerUseCase).singleton(),
        getProfileUseCase: asClass(GetProfileUseCase).singleton(),
        searchProfileUseCase: asClass(SearchProfilesUseCase).singleton(),
        followUserUseCase: asClass(FollowUserUseCase).singleton(),
        unfollowUserUseCase: asClass(UnfollowUserUseCase).singleton(),
        getFollowersUseCase: asClass(GetFollowersUseCase).singleton(),
        getFollowingUseCase: asClass(GetFollowingUseCase).singleton(),

        // --- Jobs ---
        userPurgeJob: asClass(UserPurgeJob).singleton(),
        refreshTokenPurgeJob: asClass(RefreshTokenPurgeJob).singleton(),

        // --- Schedulers ---
        userPurgeScheduler: asFunction((userPurgeJob, config, logger) => {
            return new UserPurgeScheduler(
                userPurgeJob,
                { cronExpression: config.USER_PURGE_CRON },
                logger,
            );
        }).singleton(),

        refreshTokenPurgeScheduler: asFunction(
            (refreshTokenPurgeJob, config, logger) => {
                return new RefreshTokenPurgeScheduler(
                    refreshTokenPurgeJob,
                    { cronExpression: config.REFRESH_TOKEN_PURGE_CRON },
                    logger,
                );
            },
        ).singleton(),

        // --- Controllers ---
        userController: asClass(UserController).singleton(),
        authController: asClass(AuthController).singleton(),
        oauthController: asClass(OAuthController).singleton(),
        profileController: asFunction(
            (
                updateAvatarUseCase,
                updateProfileUseCase,
                updateBannerUseCase,
                getProfileUseCase,
                searchProfileUseCase,
                getFollowersUseCase,
                getFollowingUseCase,
                config,
            ) => {
                return new ProfileController(
                    updateAvatarUseCase,
                    updateProfileUseCase,
                    updateBannerUseCase,
                    getProfileUseCase,
                    searchProfileUseCase,
                    getFollowersUseCase,
                    getFollowingUseCase,
                    config.R2_PUBLIC_URL,
                );
            },
        ),
        followUserController: asClass(FollowUserController).singleton(),
        wsManager: asClass(WebSocketManager).singleton(),
        realtimeService: asClass(FastifyRealtimeService).singleton(),
    });
}

export default fastifyPlugin(dependencyInjectionPlugin, {
    name: "di-plugin",
    dependencies: ["prisma-plugin", "env-plugin"],
});
