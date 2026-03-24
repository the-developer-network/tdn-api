/**
 * @module UserRoutes
 * User routes including soft delete, get me, change password, username and email.
 * @author TDN Team
 * @version 1.0.0
 */

import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
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
} from "@typings/schemas/user/solft-delete.schema";
import type { FastifyInstance } from "fastify";

/**
 * Sets up user routes on the Fastify instance
 *
 * @param fastify - The Fastify application instance
 * @returns void
 */
function userRoutes(fastify: FastifyInstance): void {
    const userController = fastify.diContainer.cradle.userController;

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

    fastify.get(
        "/me",
        {
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.STANDARD },
            schema: {
                tags: ["User"],
            },
        },
        userController.getMe.bind(userController),
    );

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
}

export default userRoutes;
