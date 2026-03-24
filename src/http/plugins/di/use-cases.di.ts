import { asClass, asFunction } from "awilix";
import { SoftDeleteUserUseCase } from "@core/use-cases/user/soft-delete";
import { CreateUserUseCase } from "@core/use-cases/user/create-user";
import { RegisterUseCase } from "@core/use-cases/auth/register";
import { LoginUseCase } from "@core/use-cases/auth/login";
import { GithubLoginUseCase } from "@core/use-cases/oauth/oauth-github";
import { RefreshUseCase } from "@core/use-cases/auth/refresh";
import { LogoutUseCase } from "@core/use-cases/auth/logout";
import { SendVerificationEmailUseCase } from "@core/use-cases/auth/send-verification-email";
import { VerifyEmailUseCase } from "@core/use-cases/auth/verify-email";
import { ForgotPasswordUseCase } from "@core/use-cases/auth/forgot-password";
import { ResetPasswordUseCase } from "@core/use-cases/auth/reset-password";
import { RecoverAccountUseCase } from "@core/use-cases/auth/recover-account";
import { GoogleLoginUseCase } from "@core/use-cases/oauth/oauth-google";
import { PurgeExpiredUsersUseCase } from "@core/use-cases/user/purge-expired-users";
import { PurgeExpiredTokensUseCase } from "@core/use-cases/auth/cleanup-refresh-tokens";
import { GetMeUserUseCase } from "@core/use-cases/user/get-me";
import { ChangePasswordUseCase } from "@core/use-cases/user/change-password";
import { ChangeUsernameUseCase } from "@core/use-cases/user/change-username";
import { ChangeEmailUseCase } from "@core/use-cases/user/change-email";
import { UpdateAvatarUseCase } from "@core/use-cases/profile/update-avatar";
import { UpdateProfileUseCase } from "@core/use-cases/profile/update-profil";
import { UpdateBannerUseCase } from "@core/use-cases/profile/update-banner";
import { GetProfileUseCase } from "@core/use-cases/profile/get-profile";
import { SearchProfilesUseCase } from "@core/use-cases/profile/search-profile";
import { FollowUserUseCase } from "@core/use-cases/follow-user/follow-user";
import { UnfollowUserUseCase } from "@core/use-cases/follow-user/unfollow-user";
import { GetFollowersUseCase } from "@core/use-cases/follow-user/get-followers";
import { GetFollowingUseCase } from "@core/use-cases/follow-user/get-following";
import { GetUserNotificatonUseCase } from "@core/use-cases/notification/get-user";
import { MarkAllNotificationsAsReadUseCase } from "@core/use-cases/notification/mark-all";
import { PurgeExpiredNotificationsUseCase } from "@core/use-cases/notification/purge-expired";
import { CreatePostUseCase } from "@core/use-cases/post/create-post";
import { UploadPostMediaUseCase } from "@core/use-cases/post/upload-post-media";
import { GetPostsUseCase } from "@core/use-cases/post/get-post";
import { DeletePostUseCase } from "@core/use-cases/post/delete-post";

export const useCasesModule = {
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
    purgeExpiredTokensUseCase: asClass(PurgeExpiredTokensUseCase).singleton(),
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
    getUserNotificationsUseCase: asClass(GetUserNotificatonUseCase).singleton(),
    markAllReadUseCase: asClass(MarkAllNotificationsAsReadUseCase).singleton(),
    purgeExpiredNotificationsUseCase: asClass(
        PurgeExpiredNotificationsUseCase,
    ).singleton(),
    createPostUseCase: asFunction(
        (postRepository, redisService) =>
            new CreatePostUseCase(postRepository, redisService),
    ).singleton(),
    uploadPostMediaUseCase: asClass(UploadPostMediaUseCase).singleton(),
    getPostsUseCase: asFunction(
        (postRepository, redisService) =>
            new GetPostsUseCase(postRepository, redisService),
    ).singleton(),
    deletePostUseCase: asFunction(
        (postRepository, storageService, logger, redisService) =>
            new DeletePostUseCase(
                postRepository,
                storageService,
                logger,
                redisService,
            ),
    ).singleton(),
};
