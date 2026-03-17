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

function userRoutes(fastify: FastifyInstance): void {
    const userController = fastify.diContainer.cradle.userController;

    fastify.delete<{ Body: SoftDeleteUserBody }>(
        "/me",
        {
            schema: {
                body: SoftDeleteUserSchema,
            },
            onRequest: [fastify.authenticate],
        },
        userController.softDeleteMe.bind(userController),
    );

    fastify.get(
        "/me",
        { onRequest: [fastify.authenticate] },
        userController.getMe.bind(userController),
    );

    fastify.patch<{ Body: ChangePasswordBody }>(
        "/me/password",
        {
            schema: {
                body: ChangePasswordSchema,
            },
            onRequest: [fastify.authenticate],
        },
        userController.changePasswordMe.bind(userController),
    );

    fastify.patch<{ Body: ChangeUsernameBody }>(
        "/me/username",
        {
            schema: {
                body: ChangeUsernameSchema,
            },
            onRequest: [fastify.authenticate],
        },
        userController.changeUsernameMe.bind(userController),
    );
    fastify.patch<{ Body: ChangeEmailBody }>(
        "/me/email",
        {
            schema: {
                body: ChangeEmailSchema,
            },
            onRequest: [fastify.authenticate],
        },
        userController.changeEmailMe.bind(userController),
    );
}

export default userRoutes;
