import type AuthController from "@services/auth.controller";
import type OAuthController from "@services/oauth.controller";
import type UserController from "@services/user.controller";
import type { UserPurgeJob } from "@infrastructure/jobs/user-purge.job";
import type { UserPurgeScheduler } from "@infrastructure/jobs/user-purge.scheduler";
import type { RefreshTokenPurgeScheduler } from "@infrastructure/jobs/refresh-token-purge.scheduler";
import type { ProfileController } from "@services/profile.controller";
import type { FollowUserController } from "@services/follow-user.controller";
import type { WebSocketManager } from "@infrastructure/websocket/websocket-manager";

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
    }
}

export {};
