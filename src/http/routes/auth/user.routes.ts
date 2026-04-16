import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    type GetUserPostsParams,
    getUserPostsParamsSchema,
    type GetUserPostsQuery,
    getUserPostsQuerySchema,
    GetUserPostsResponseSchema,
    type GetUserPostsResponse,
} from "@typings/schemas/post/get-user-posts.schema";
import {
    type ChangeEmailBody,
    ChangeEmailSchema,
} from "@typings/schemas/user/change-email.schema";
import {
    type ChangePasswordBody,
    ChangePasswordSchema,
} from "@typings/schemas/user/change-password.schema";
import {
    type ChangeUsernameBody,
    ChangeUsernameSchema,
} from "@typings/schemas/user/change-username.schema";
import {
    type SoftDeleteUserBody,
    SoftDeleteUserSchema,
} from "@typings/schemas/user/soft-delete.schema";
import type { FastifyInstance } from "fastify";
import { GetMeResponseSchema } from "@typings/schemas/user/get-me.response.schema";

/**
 * Defines the routes related to user operations such as fetching the authenticated user's profile, changing password, username, email, and fetching posts created by a specific user. Each route is protected with appropriate authentication and rate limiting policies to ensure security and prevent abuse. The routes are structured to provide clear API endpoints for client applications to interact with user-related functionalities in the system.
 * @param fastify - The Fastify instance used to register the routes.
 * @returns void - This function does not return anything. It registers the routes directly on the Fastify instance.
 */
function userRoutes(fastify: FastifyInstance): void {
    const userController = fastify.diContainer.cradle.userController;

    /**
     * Route to soft delete the authenticated user's account. It requires the user to provide their password for confirmation. The route is protected and can only be accessed by authenticated users. It applies a strict rate limit policy to prevent abuse. Upon successful deletion, it returns a 204 No Content response.
     * @route DELETE /users/me
     * @param request - The Fastify request object containing the authenticated user information and the password in the body.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     */
    fastify.delete<{ Body: SoftDeleteUserBody }>(
        "/me",
        {
            schema: {
                body: SoftDeleteUserSchema,
                tags: ["User"],
            },
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.STRICT },
        },
        userController.softDeleteMe.bind(userController),
    );

    /**
     * Route to get the authenticated user's profile information. The route is protected and can only be accessed by authenticated users. It applies a standard rate limit policy. Upon successful retrieval, it returns a structured response containing the user's profile information along with metadata such as a timestamp.
     * @route GET /users/me
     * @param request - The Fastify request object containing the authenticated user information.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     */
    fastify.get(
        "/me",
        {
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.STANDARD },
            schema: {
                response: { 200: GetMeResponseSchema },
                tags: ["User"],
            },
        },
        userController.getMe.bind(userController),
    );

    /**
     * Route to change the password of the authenticated user. It requires the user to provide their current password and the new password. The route is protected and can only be accessed by authenticated users. It applies a strict rate limit policy to prevent abuse. Upon successful password change, it returns a 204 No Content response.
     * @route PATCH /users/me/password
     * @param request - The Fastify request object containing the current and new passwords in the body and the authenticated user information.
     * @param reply - The Fastify reply object used to send the response.
     * @return A promise that resolves when the response is sent.
     */
    fastify.patch<{ Body: ChangePasswordBody }>(
        "/me/password",
        {
            schema: {
                body: ChangePasswordSchema,
                tags: ["User"],
            },
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.STRICT },
        },
        userController.changePasswordMe.bind(userController),
    );

    /**
     * Route to change the username of the authenticated user. It requires the user to provide the new username. The route is protected and can only be accessed by authenticated users. It applies a strict rate limit policy to prevent abuse. Upon successful username change, it returns a 204 No Content response.
     * @route PATCH /users/me/username
     * @param request - The Fastify request object containing the new username in the body and the authenticated user information.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     */
    fastify.patch<{ Body: ChangeUsernameBody }>(
        "/me/username",
        {
            schema: {
                body: ChangeUsernameSchema,
                tags: ["User"],
            },
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.STRICT },
        },
        userController.changeUsernameMe.bind(userController),
    );

    /**
     * Route to change the email of the authenticated user. It requires the user to provide the new email address. The route is protected and can only be accessed by authenticated users. It applies a strict rate limit policy to prevent abuse. Upon successful email change, it returns a 204 No Content response.
     * @route PATCH /users/me/email
     * @param request - The Fastify request object containing the new email in the body and the authenticated user information.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     */
    fastify.patch<{ Body: ChangeEmailBody }>(
        "/me/email",
        {
            schema: {
                body: ChangeEmailSchema,
                tags: ["User"],
            },
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.STRICT },
        },
        userController.changeEmailMe.bind(userController),
    );

    /**
     * Route to get posts created by a specific user. It accepts the username as a path parameter and supports pagination through query parameters. The route is accessible to both authenticated and unauthenticated users, but it applies a standard rate limit policy to prevent abuse. Upon successful retrieval, it returns a structured response containing the list of posts created by the specified user along with pagination metadata.
     * @route GET /users/:username/posts
     * @param request - The Fastify request object containing the username as a path parameter and pagination information in the query string.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     */
    fastify.get<{
        Params: GetUserPostsParams;
        Querystring: GetUserPostsQuery;
        Reply: { 200: GetUserPostsResponse };
    }>(
        "/:username/posts",
        {
            schema: {
                params: getUserPostsParamsSchema,
                querystring: getUserPostsQuerySchema,
                response: { 200: GetUserPostsResponseSchema },
                tags: ["User"],
            },
            config: { rateLimit: RateLimitPolicies.STANDARD },
            onRequest: [fastify.optionalAuthenticate],
        },
        userController.getUserPosts.bind(userController),
    );
}

export default userRoutes;
