import type AuthController from "@services/auth.controller";
import type OAuthController from "@services/oauth.controller";
import type UserController from "@services/user.controller";
import type { UserPurgeJob } from "@infrastructure/jobs/user/user-purge.job";
import type { UserPurgeScheduler } from "@infrastructure/jobs/user/user-purge.scheduler";
import type { RefreshTokenPurgeScheduler } from "@infrastructure/jobs/refresh-token/refresh-token-purge.scheduler";
import type { ProfileController } from "@services/profile.controller";
import type { FollowUserController } from "@services/follow-user.controller";
import type { WebSocketManager } from "@infrastructure/websocket/websocket-manager";
import type NotificationController from "@services/notification.controller";
import type { NotificationPurgeScheduler } from "@infrastructure/jobs/notification/notification-purge.scheduler";

declare module "@fastify/awilix" {
    interface Cradle {
        userController: UserController;
        authController: AuthController;
        oauthController: OAuthController;
        profileController: ProfileController;
        userPurgeJob: UserPurgeJob;
        userPurgeScheduler: UserPurgeScheduler;
        refreshTokenPurgeScheduler: RefreshTokenPurgeScheduler;
        followUserController: FollowUserController;
        wsManager: WebSocketManager;
        notificationController: NotificationController;
        notificationPurgeScheduler: NotificationPurgeScheduler;
    }
}

export {};
