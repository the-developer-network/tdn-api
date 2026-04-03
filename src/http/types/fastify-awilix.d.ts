import type AuthController from "@services/auth.controller";
import type OAuthController from "@services/oauth.controller";
import type UserController from "@services/user.controller";
import type { UserPurgeJob } from "@infrastructure/jobs/user/user-purge.job";
import type { UserPurgeScheduler } from "@infrastructure/jobs/user/user-purge.scheduler";
import type { RefreshTokenPurgeScheduler } from "@infrastructure/jobs/refresh-token/refresh-token-purge.scheduler";
import type { ProfileController } from "@services/profile.controller";
import type { FollowUserController } from "@services/follow-user.controller";
import type { WebSocketManager } from "@infrastructure/realtime/websocket/websocket-manager";
import type NotificationController from "@services/notification.controller";
import type { NotificationPurgeScheduler } from "@infrastructure/jobs/notification/notification-purge.scheduler";
import type PostController from "@services/post.controller";
import type { CommentController } from "@controllers/comment.controller";
import type { LikeController } from "@controllers/like.controller";
import type { BookmarkController } from "@controllers/bookmark.controller";
import type { CachePort } from "@core/ports/services/cache.port";

/**
 * Fastify Awilix cradle interface for dependency injection
 * Defines all injectable services and components available in the application
 */
declare module "@fastify/awilix" {
    interface Cradle {
        /** Controller for user management operations */
        userController: UserController;

        /** Controller for authentication operations */
        authController: AuthController;

        /** Controller for OAuth operations */
        oauthController: OAuthController;

        /** Controller for user profile operations */
        profileController: ProfileController;

        /** Job for purging expired user accounts */
        userPurgeJob: UserPurgeJob;

        /** Scheduler for user purge jobs */
        userPurgeScheduler: UserPurgeScheduler;

        /** Scheduler for refresh token purge jobs */
        refreshTokenPurgeScheduler: RefreshTokenPurgeScheduler;

        /** Controller for follow/unfollow operations */
        followUserController: FollowUserController;

        /** WebSocket manager for real-time communication */
        wsManager: WebSocketManager;

        /** Controller for notification operations */
        notificationController: NotificationController;

        /** Scheduler for notification purge jobs */
        notificationPurgeScheduler: NotificationPurgeScheduler;

        /** Controller for post operations */
        postController: PostController;

        /** Controller for comment operations */
        commentController: CommentController;

        /** */
        likeController: LikeController;

        /** */
        bookmarkController: BookmarkController;

        /** Redis-backed cache service */
        cacheService: CachePort;
    }
}

export {};
