import { asClass, asFunction } from "awilix";
import { UserController } from "@controllers/user.controller";
import { AuthController } from "@controllers/auth.controller";
import { OAuthController } from "@controllers/oauth.controller";
import { NotificationController } from "@controllers/notification.controller";
import { PostController } from "@controllers/post.controller";
import { LikeController } from "@controllers/like.controller";
import { ProfileController } from "@controllers/profile.controller";
import { FollowUserController } from "@controllers/follow-user.controller";
import { CommentController } from "@controllers/comment.controller";
import { BookmarkController } from "@controllers/bookmark.controller";

/**
 * Dependency injection module for controllers
 * Registers all HTTP controllers as singleton instances
 */
export const controllersModule = {
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
    notificationController: asClass(NotificationController).singleton(),
    postController: asClass(PostController).singleton(),
    commentController: asClass(CommentController).singleton(),
    likeController: asFunction(
        (likePostUseCase, unlikePostUseCase) =>
            new LikeController(likePostUseCase, unlikePostUseCase),
    ).singleton(),
    bookmarkController: asClass(BookmarkController).singleton(),
};
