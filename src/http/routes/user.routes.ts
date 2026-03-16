import type { SoftDeleteUserUseCaseInput } from "@core/use-cases/user/soft-delete/soft-delete-user-usecase.input";
import { SoftDeleteUserSchema } from "@typings/schemas/user/solft-delete.schema";
import type { FastifyInstance } from "fastify";

function userRoutes(fastify: FastifyInstance): void {
    const userController = fastify.diContainer.cradle.userController;

    fastify.delete<{ Body: SoftDeleteUserUseCaseInput }>(
        "/me",
        {
            schema: SoftDeleteUserSchema,
            onRequest: [fastify.authenticate],
        },
        userController.softDelete.bind(userController),
    );

    fastify.get(
        "/me",
        { onRequest: [fastify.authenticate] },
        userController.getMe.bind(userController),
    );
}

export default userRoutes;
